import { objectArgument, returnObject } from "standard-io"

function chainer({ args, bind_to, fn }) {
  return (...chains) => {
    let rand = Math.floor(Math.random() * (100 + 1))
    let promise

    chains.forEach(c => {
      if (promise) {
        promise = promise
          .then(() => c(args))
          .then(value => {
            mergeArgs({ args, value })
            return args
          })
      } else {
        if (typeof c == "function") {
          c = c(args)
        }
        if (!c) {
          // do nothing
        } else if (c.async || (c.value == undefined && c.then)) {
          args.async = true
          promise = c.then(value => {
            mergeArgs({ args, value })
            return args
          })
        } else {
          mergeArgs({ args, value: c })
        }
      }
    })

    promise = promise || Promise.resolve(args)
    let output = returnObject({ value: args })
    output.then = promise.then.bind(promise)

    return output
  }
}

function mergeArgs({ args, value={} }) {
  if (typeof value == "object") {
    for (let key in value) {
      if (key != "then") {
        args[key] = value[key]
      }
    }
  } else {
    args.value = value
  }
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

  args = objectArgument({ args, ignore })
  let chain = chainer({ args: args.args, bind_to, fn })
  args.promise = { chain, resolve, reject }
  
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
