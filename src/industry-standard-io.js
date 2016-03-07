import { objectArgument, returnObject } from "standard-io"

function resolveReject() {
  let resolve, reject
  let promise = new Promise((...args) => {
    [ resolve, reject ] = args
  })
  return { promise, resolve, reject }
}

function runAndReturn({ args, fn, bind_to }) {
  let { promise, resolve, reject } = resolveReject()
  let value = fn.bind(bind_to)(objectArgument({ args, resolve, reject }))
  return returnObject({ promise, value })
}

export let standard_io = Class =>
  class extends Class {
    constructor(...args) {
      super(objectArgument({ args }))

      for (let [ name, fn ] of this.functions().entries()) {
        this[name] = (...args) =>
          runAndReturn({ args, fn, bind_to: this })
      }

      let ignore = [ "constructor", "factory", "functions", "state" ]

      for (let [ name, fn ] of Class.functions().entries()) {
        if (ignore.indexOf(name) == -1) {
          this.constructor[name] = (...args) =>
            runAndReturn({ args, fn, bind_to: this.constructor })
        }
      }
    }
  }
