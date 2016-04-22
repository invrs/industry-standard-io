# IndustryStandardIO [![Build Status](https://travis-ci.org/invrs/industry-standard-io.svg?branch=master)](https://travis-ci.org/invrs/industry-standard-io)

Adds [StandardIO](https://github.com/invrs/standard-io) compliance to factory methods.

## Requirements

This extension must be paired with [Functions](https://github.com/invrs/industry-functions).

## Usage

```js
import { factory } from "industry"
import { instance } from "industry-instance"
import { functions } from "industry-functions"
import { standard_io } from "industry-standard-io"

class Test {
  hello(args) {
    args // { a: 1, b: 2, args: { a: 1, b: 2 }, _args: [ "world" ] }
    return true
  }
}

let test = factory(Test)
  .set("instance", instance)
  .set("functions", functions)
  .set("standard_io", standard_io)

test().hello("world", { a: 1 }, { b: 2 }).then((value) => {
  value // true
})
```
