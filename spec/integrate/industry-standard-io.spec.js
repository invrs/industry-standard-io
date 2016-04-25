import { factory } from "industry"
import { instance } from "industry-instance"
import { functions } from "industry-functions"
import { standard_io } from "../../"

describe("standard_io", () => {
  let called = 0

  let argument = {
    a: 1, b: 2,
    args: { a: 1, b: 2 },
    _args: [ 'hello' ]
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
      init(args) {
        delete args.promise
        args._args = args._args.filter(item => item != "key")
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
      hello(args) {
        delete args.promise
        expect(args).toEqual(argument)
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
      static world(args) {
        delete args.promise
        expect(args).toEqual(argument)
        called += 1
      }
    }

    let test = makeTest().base(base)
    let test2 = makeTest().base(base)

    test().Class.world(...params)
    test("key").Class.world(...params)
    test2().Class.world(...params)
    test2("key").Class.world(...params)
    
    expect(called).toBe(4)
  })

  it("passes a promise object to instance methods", () => {
    let base = class {
      hello(args) {
        expect(args.promise).toEqual(jasmine.any(Object))
        expect(args.promise.reject).toEqual(jasmine.any(Function))
        expect(args.promise.resolve).toEqual(jasmine.any(Function))
      }
    }

    let test = makeTest().base(base)
    test().hello(...params)
  })

  it("makes hard returns thenable", (done) => {
    let base = class {
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
      hello({ promise: { resolve } }) { resolve(true) }
    }

    let test = makeTest().base(base)
    let output = test().hello()
    
    expect(output.value).toEqual(true)
    
    output.then(args => {
      expect(args).toEqual(true)
      done()
    })
  })

  it("makes rejected functions catchable", (done) => {
    let base = class {
      hello({ promise: { reject } }) { reject("rejected") }
    }

    let test = makeTest().base(base)
    let output = test().hello()
    
    expect(output.value).toEqual(undefined)
    
    output.catch(e => {
      expect(e).toEqual("rejected")
      done()
    })
  })

  it("makes thrown functions catchable", (done) => {
    let base = class {
      hello() { throw "rejected" }
    }

    let test = makeTest().base(base)
    let output = test().hello()
    
    expect(output.value).toEqual(undefined)
    
    output.catch(e => {
      expect(e).toEqual("rejected")
      done()
    })
  })

  it("calls exception function on reject", (done) => {
    let base = class {
      exception({ e }) {
        expect(e).toEqual("rejected")
        done()
      }

      hello({ promise: { reject } }) { reject("rejected") }
    }

    let test = makeTest().base(base)
    test().hello()
  })

  it("calls exception function on throw", (done) => {
    let base = class {
      exception({ e }) {
        expect(e).toEqual("rejected")
        done()
      }

      hello() { throw "rejected" }
    }

    let test = makeTest().base(base)
    test().hello()
  })
})
