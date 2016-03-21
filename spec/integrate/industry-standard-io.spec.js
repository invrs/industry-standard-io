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
        delete args.promise
        delete args.args.promise
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
      constructor() { this.standardIO() }
      
      static world(args) {
        delete args.promise
        delete args.args.promise
        expect(args).toEqual(argument)
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

  it("passes a promise object to instance methods", () => {
    let base = class {
      constructor() { this.standardIO() }

      hello(args) {
        expect(args.promise).toEqual(jasmine.any(Object))
        expect(args.promise.chain).toEqual(jasmine.any(Function))
        expect(args.promise.reject).toEqual(jasmine.any(Function))
        expect(args.promise.resolve).toEqual(jasmine.any(Function))
      }
    }

    let test = makeTest().base(base)
    test().hello(...params)
  })

  it("implements the chain function", (done) => {
    let base = class {
      constructor() { this.standardIO() }
      
      a() { return { a: 1 } }
      b({ promise: { resolve } }) { resolve({ b: 2 }) }
      c({ promise: { resolve } }) { setTimeout(() => resolve({ c: 3 }), 1) }
      d() { return { d: 4 } }
      e() { return { e: 5 } }
      f({ promise: { resolve } }) { resolve({ f: 6 }) }
      empty({ promise: { resolve }, value }) { return value || true }
      chain({ promise: { chain } }) { return chain(this.c, this.empty, this.d) }

      run({ promise: { chain } }) {
        return chain(
          chain(this.a, this.empty),
          this.b, this.chain, this.e, this.f
        )
      }
    }

    let test = makeTest().base(base)
    let value = test().run()
    let expected = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, value: true }
    
    value.then(args => {
      expect(args).toEqual({
        ...expected,
        args: expected,
        _args: []
      })
      done()
    })

    delete value.then
    expect(value).toEqual({
      a: 1, b: 2, d: 4, e: 5, f: 6, value: { f: 6 }
    })
  })

  it("returns a synchronous value from the chain function", () => {
    let base = class {
      constructor() { this.standardIO() }
      
      a() { return "a" }
      b({ promise: { resolve } }) { resolve("b") }

      run({ promise: { chain } }) {
        return chain(this.a, this.b)
      }
    }

    let test = makeTest().base(base)
    expect(test().run().value).toBe("b")
  })

  it("allows chains from multiple functions", (done) => {
    let base = class {
      constructor() { this.standardIO() }
      
      a() { return { a: 1 } }
      b() { return { b: 2 } }
      c() { return { c: 3 } }
      d() { return { d: 4 } }

      chain({ promise: { chain } }) {
        return chain(this.c, this.d)
      }

      chain2({ promise: { chain } }) {
        return chain(this.a, this.b, this.chain)
      }

      run({ promise: { chain } }) {
        return this.chain2()
      }
    }

    let test = makeTest().base(base)
    
    let output = test().run()
    let expected = { a: 1, b: 2, c: 3, d: 4, value: { d: 4 } }

    output.then(args => {
      expect(args).toEqual({
        ...expected,
        args: expected,
        _args: []
      })
      done()
    })

    delete output.then
    expect(output).toEqual(expected)
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
      
      hello({ promise: { resolve } }) { resolve(true) }
    }

    let test = makeTest().base(base)
    let output = test().hello()
    expect(output.value).toEqual(true)
    output.then((args) => {
      expect(args).toEqual(true)
      done()
    })
  })
})
