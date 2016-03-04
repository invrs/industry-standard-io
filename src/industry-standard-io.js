import { objectArgument } from "standard-io"

export let standard_io = Class =>
  class extends Class {
    constructor(...args) {
      super(objectArgument({ args }))

      for (let [ name, fn ] of this.functions().entries()) {
        this[name] = (...args) =>
          fn.bind(this)(objectArgument({ args }))
      }

      let ignore = [ "constructor", "factory", "functions" ]

      for (let [ name, fn ] of Class.functions().entries()) {
        if (ignore.indexOf(name) == -1) {
          this.constructor[name] = (...args) =>
            fn.bind(this.constructor)(objectArgument({ args }))
        }
      }
    }
  }
