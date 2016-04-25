import { objectArgument, returnObject } from "standard-io"

function exception(e) {
  if (this.exception) {
    this.exception({ e })
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
  let value

  args = objectArgument({ args, ignore: ignore.args })
  args.promise = { resolve, reject }
  
  try {
    value = fn.bind(bind_to)(args)
  } catch (e) {
    reject(e)
  }

  if (status.value) {
    value = status.value
  }

  promise = promise.catch(e => {
    exception.bind(bind_to)(e)
    throw e
  })
  
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
