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

function chainArg({ args, ignore, value={} }) {
  [ "_args", "args", "promise" ].forEach(key => {
    delete args[key]
    delete value[key]
  })

  if (typeof value != "object") {
    value = { value }
  }

  return objectArgument({
    args: [ args, withoutThen(value) ],
    ignore
  })
}

function patch(ignore, type) {
  for (let name in this.functions()) {
    if (ignore[type].indexOf(name) == -1) {
      let fn = this[name]
      this[name] = (...args) =>
        runAndReturn({ args, fn, ignore, name, bind_to: this })
    }
  }
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

function runAndReturn({ args, fn, ignore, name, bind_to }) {
  let { promise, resolve, reject, status } = resolveReject()
  ignore = ignore.args
  
  let chainer = (...chains) => {
    let promise
    
    chains.forEach(c => {
      if (promise) {
        promise = promise
          .then(() => c(args))
          .then(value => {
            args = chainArg({ args, value, ignore })
            return args
          })
      } else {
        if (typeof c == "function") {
          c = c(args)
        }
        if (!c) {
          // do nothing
        } else if (c.value == undefined && c.then) {
          promise = c.then(value => {
            args = chainArg({ args, value, ignore })
            return args
          })
        } else {
          args = chainArg({ args, value: c, ignore })
        }
      }
    })

    args = chainArg({ args, ignore })

    promise = promise || Promise.resolve(args)
    let output = returnObject({ value: args.args })
    output.then = promise.then.bind(promise)

    return output
  }
  
  args.push({ promise: { chain: chainer, resolve, reject } })
  args = objectArgument({ args, ignore })

  let value = fn.bind(bind_to)(args)

  if (status.value) {
    value = status.value
  }
  
  return returnObject({ promise, value })
}

export let standard_io = Class =>
  class extends Class {
    static beforeFactoryOnce() {
      this.industry({
        ignore: {
          args: [ "promise" ]
        }
      })
      patch.bind(this)(this.industry().ignore, "Class")
      super.beforeFactoryOnce()
    }

    beforeInit() {
      patch.bind(this)(this.Class.industry().ignore, "instance")
      super.beforeInit()
    }
  }
