# IndustryStandardIO [![Build Status](https://travis-ci.org/invrs/industry-standard-io.svg?branch=master)](https://travis-ci.org/invrs/industry-standard-io)

Makes factory instance methods [StandardIO](https://github.com/invrs/standard-io) compliant.

## Requirements

This extension must be paired with [IndustryFunctions](https://github.com/invrs/industry-functions).

## Usage

```js
import { factory } from "industry"
import { instance } from "industry-instance"
import { functions } from "industry-functions"
import { standard_io } from "industry-standard-io"

let test = factory()
  .set("instance", instance)
  .set("functions", functions)
  .set("standard_io", standard_io)
  .base(class {
    constructor() {
      this.standardIO()
    }
    
    hello(...args) {
      args // { a: 1, b: 2, args: { a: 1, b: 2 }, _args: [ "world" ] }
      return true
    }
  })

test().hello("world", { a: 1 }, { b: 2 }).then((value) => {
  value // true
})
```
