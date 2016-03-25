import { objectArgument, returnObject } from "standard-io"

function withoutThen(obj) {
  let obj2 = {}
  for (let key in obj) {
    if (key != "then") {
      obj2[key] = obj[key]
    }
  }
  return obj2
}

function chainArg(args, value={}) {
  [ "_args", "args", "promise" ].forEach(key => {
    delete args[key]
    delete value[key]
  })

  if (typeof value != "object") {
    value = { value }
  }

  return objectArgument({ args: [ args, withoutThen(value) ] })
}

function resolveReject() {
  let resolve, reject
  let promise = new Promise((...args) => {
    [ resolve, reject ] = args
  })
  let status = {}
  let resolver = value => {
    status.value = value
    resolve(value)
  }
  return { promise, resolve: resolver, reject, status }
}

function runAndReturn({ args, fn, name, bind_to }) {
  let { promise, resolve, reject, status } = resolveReject()
  
  let chainer = (...chains) => {
    let promise
    
    chains.forEach(c => {
      if (promise) {
        promise = promise
          .then(() => c(args))
          .then(output => {
            args = chainArg(args, output)
            return args
          })
      } else {
        if (typeof c == "function") {
          c = c(args)
        }
        if (!c) {
          // do nothing
        } else if (c.value == undefined && c.then) {
          promise = c.then(output => {
            args = chainArg(args, output)
            return args
          })
        } else {
          args = chainArg(args, c)
        }
      }
    })

    args = chainArg(args)

    promise = promise || Promise.resolve(args)
    let output = returnObject({ value: args.args })
    output.then = promise.then.bind(promise)

    return output
  }
  
  args.push({ promise: { chain: chainer, resolve, reject } })
  args = objectArgument({ args })

  let value = fn.bind(bind_to)(args)

  if (status.value) {
    value = status.value
  }
  
  return returnObject({ promise, value })
}

export let standard_io = Class =>
  class extends Class {
    constructor(...args) {
      super(objectArgument({ args }))
    }

    standardIO(ignore = []) {
      ignore = ignore.concat([
        "functions", "include", "standardIO", "state", "stateful"
      ])

      for (let [ name, fn ] of this.functions().entries()) {
        if (ignore.indexOf(name) == -1) {
          this[name] = (...args) =>
            runAndReturn({ args, fn, name, bind_to: this })
        }
      }

      ignore = ignore.concat([ "constructor", "factory" ])

      for (let [ name, fn ] of Class.functions().entries()) {
        if (ignore.indexOf(name) == -1) {
          this.constructor[name] = (...args) =>
            runAndReturn({ args, fn, name, bind_to: this.constructor })
        }
      }
    }
  }
