import { factory } from "industry"
import { instance } from "industry-instance"
import { functions } from "industry-functions"
import { standard_io } from "../../"

describe("standard_io", () => {
  let called = 0

  let argument = {
    a: 1, b: 2,
    args: { a: 1, b: 2 },
    _args: [ 'hello' ],
    resolve: undefined,
    reject: undefined
  }

  let params = [ { a: 1 }, { b: 2 }, "hello" ]

  function makeTest() {
    return factory()
      .set("instance", instance)
      .set("functions", functions)
      .set("standard_io", standard_io)
  }

  beforeEach(() => {
    called = 0
  })

  it("passes a single object to the constructor", () => {
    let base = class {
      constructor(args) {
        expect(args).toEqual(argument)
        called += 1
      }
    }

    let test = makeTest().base(base)
    let test2 = makeTest().base(base)
    
    test(...params)
    test("key", ...params)
    test2(...params)
    test2("key", ...params)
    
    expect(called).toBe(4)
  })

  it("passes a single object to instance methods", () => {
    let base = class {
      constructor() { this.standardIO() }

      hello(args) {
        expect({ ...args, resolve: undefined, reject: undefined })
          .toEqual(argument)
        called += 1
      }
    }

    let test = makeTest().base(base)
    let test2 = makeTest().base(base)
    
    test().hello(...params)
    test("key").hello(...params)
    test2().hello(...params)
    test2("key").hello(...params)
    
    expect(called).toBe(4)
  })

  it("passes a single object to class methods", () => {
    let base = class {
      constructor() { this.standardIO() }
      
      static world(args) {
        expect({ ...args, resolve: undefined, reject: undefined })
          .toEqual(argument)
        called += 1
      }
    }

    let test = makeTest().base(base)
    let test2 = makeTest().base(base)

    test().constructor.world(...params)
    test("key").constructor.world(...params)
    test2().constructor.world(...params)
    test2("key").constructor.world(...params)
    
    expect(called).toBe(4)
  })

  it("makes hard returns thenable", (done) => {
    let base = class {
      constructor() { this.standardIO() }
      hello() { return true }
    }

    let test = makeTest().base(base)
    test().hello().then((args) => {
      expect(args).toEqual(true)
      done()
    })
  })

  it("makes resolved functions thenable", (done) => {
    let base = class {
      constructor() { this.standardIO() }
      
      hello({ resolve }) { resolve(true) }
    }

    let test = makeTest().base(base)
    test().hello().then((args) => {
      expect(args).toEqual(true)
      done()
    })
  })
})
