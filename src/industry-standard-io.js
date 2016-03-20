import { objectArgument, returnObject } from "standard-io"

function chainArg(args, value) {
  delete args._args
  delete args.args
  delete args.promise

  if (typeof value != "object") {
    value = { value }
  }

  return objectArgument({ args: [ args, value ] })
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

function runAndReturn({ args, fn, bind_to }) {
  let { promise, resolve, reject, status } = resolveReject()
  
  let chainer = (...chains) => {
    let promise = Promise.resolve(args)
    
    chains.forEach(c => {
      if (c && c.then) {
        promise = promise.then(() => c)
      } else if (typeof c == "function") {
        promise = promise
          .then(c)
          .then(value => args = chainArg(args, value))
      } else {
        promise = promise
          .then(() => args = chainArg(args, c))
      }
    })

    return promise
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
      ignore = ignore.concat(
        [ "functions", "include", "standardIO", "state", "stateful" ]
      )

      for (let [ name, fn ] of this.functions().entries()) {
        if (ignore.indexOf(name) == -1) {
          this[name] = (...args) =>
            runAndReturn({ args, fn, bind_to: this })
        }
      }

      ignore = ignore.concat([ "constructor", "factory" ])

      for (let [ name, fn ] of Class.functions().entries()) {
        if (ignore.indexOf(name) == -1) {
          this.constructor[name] = (...args) =>
            runAndReturn({ args, fn, bind_to: this.constructor })
        }
      }
    }
  }
