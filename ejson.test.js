import { assertEquals, assertThrows, assertNotEquals } from "jsr:@std/assert@1.0.12";

import { EJSON } from './ejson.js';
import EJSONTest from './custom_models_for_tests.js';

Deno.test('ejson - keyOrderSensitive', test => {
  assertEquals(true, EJSON.equals({
    a: {b: 1, c: 2},
    d: {e: 3, f: 4},
  }, {
    d: {f: 4, e: 3},
    a: {c: 2, b: 1},
  }));

  assertEquals(false, EJSON.equals({
    a: {b: 1, c: 2},
    d: {e: 3, f: 4},
  }, {
    d: {f: 4, e: 3},
    a: {c: 2, b: 1},
  }, {keyOrderSensitive: true}));

  assertEquals(false, EJSON.equals({
    a: {b: 1, c: 2},
    d: {e: 3, f: 4},
  }, {
    a: {c: 2, b: 1},
    d: {f: 4, e: 3},
  }, {keyOrderSensitive: true}));
  assertEquals(false, EJSON.equals({a: {}}, {a: {b: 2}}, {keyOrderSensitive: true}));
  assertEquals(false, EJSON.equals({a: {b: 2}}, {a: {}}, {keyOrderSensitive: true}));
});

Deno.test('ejson - nesting and literal', test => {
  const d = new Date();
  const obj = {$date: d};
  const eObj = EJSON.toJSONValue(obj);
  const roundTrip = EJSON.fromJSONValue(eObj);
  assertEquals(obj, roundTrip);
});

Deno.test('ejson - some equality tests', test => {
  assertEquals(true, EJSON.equals({a: 1, b: 2, c: 3}, {a: 1, c: 3, b: 2}));
  assertEquals(false, EJSON.equals({a: 1, b: 2}, {a: 1, c: 3, b: 2}));
  assertEquals(false, EJSON.equals({a: 1, b: 2, c: 3}, {a: 1, b: 2}));
  assertEquals(false, EJSON.equals({a: 1, b: 2, c: 3}, {a: 1, c: 3, b: 4}));
  assertEquals(false, EJSON.equals({a: {}}, {a: {b: 2}}));
  assertEquals(false, EJSON.equals({a: {b: 2}}, {a: {}}));
  // XXX: Object and Array were previously mistaken, which is why
  // we add some extra tests for them here
  assertEquals(true, EJSON.equals([1, 2, 3, 4, 5], [1, 2, 3, 4, 5]));
  assertEquals(false, EJSON.equals([1, 2, 3, 4, 5], [1, 2, 3, 4]));
  assertEquals(false, EJSON.equals([1,2,3,4], {0: 1, 1: 2, 2: 3, 3: 4}));
  assertEquals(false, EJSON.equals({0: 1, 1: 2, 2: 3, 3: 4}, [1,2,3,4]));
  assertEquals(false, EJSON.equals({}, []));
  assertEquals(false, EJSON.equals([], {}));
});

Deno.test('ejson - equality and falsiness', test => {
  assertEquals(true, EJSON.equals(null, null));
  assertEquals(true, EJSON.equals(undefined, undefined));
  assertEquals(false, EJSON.equals({foo: 'foo'}, null));
  assertEquals(false, EJSON.equals(null, {foo: 'foo'}));
  assertEquals(false, EJSON.equals(undefined, {foo: 'foo'}));
  assertEquals(false, EJSON.equals({foo: 'foo'}, undefined));
});

Deno.test('ejson - NaN and Inf', test => {
  assertEquals(EJSON.parse('{"$InfNaN": 1}'), Infinity);
  assertEquals(EJSON.parse('{"$InfNaN": -1}'), -Infinity);
  assertEquals(true, Number.isNaN(EJSON.parse('{"$InfNaN": 0}')));
  assertEquals(EJSON.parse(EJSON.stringify(Infinity)), Infinity);
  assertEquals(EJSON.parse(EJSON.stringify(-Infinity)), -Infinity);
  assertEquals(true, Number.isNaN(EJSON.parse(EJSON.stringify(NaN))));
  assertEquals(true, EJSON.equals(NaN, NaN));
  assertEquals(true, EJSON.equals(Infinity, Infinity));
  assertEquals(true, EJSON.equals(-Infinity, -Infinity));
  assertEquals(false, EJSON.equals(Infinity, -Infinity));
  assertEquals(false, EJSON.equals(Infinity, NaN));
  assertEquals(false, EJSON.equals(Infinity, 0));
  assertEquals(false, EJSON.equals(NaN, 0));

  assertEquals(true, EJSON.equals(
    EJSON.parse('{"a": {"$InfNaN": 1}}'),
    {a: Infinity}
  ));
  assertEquals(true, EJSON.equals(
    EJSON.parse('{"a": {"$InfNaN": 0}}'),
    {a: NaN}
  ));
});

Deno.test('ejson - clone', test => {
  const cloneTest = (x, identical) => {
    const y = EJSON.clone(x);
    assertEquals(true, EJSON.equals(x, y));
    assertEquals(x === y, !!identical);
  };
  cloneTest(null, true);
  cloneTest(undefined, true);
  cloneTest(42, true);
  cloneTest('asdf', true);
  cloneTest([1, 2, 3]);
  cloneTest([1, 'fasdf', {foo: 42}]);
  cloneTest({x: 42, y: 'asdf'});

  function testCloneArgs(/*arguments*/) {
    const clonedArgs = EJSON.clone(arguments);
    assertEquals(clonedArgs, [1, 2, 'foo', [4]]);
  };
  testCloneArgs(1, 2, 'foo', [4]);
});

Deno.test('ejson - stringify', test => {
  assertEquals(EJSON.stringify(null), 'null');
  assertEquals(EJSON.stringify(true), 'true');
  assertEquals(EJSON.stringify(false), 'false');
  assertEquals(EJSON.stringify(123), '123');
  assertEquals(EJSON.stringify('abc'), '"abc"');

  assertEquals(EJSON.stringify([1, 2, 3]),
     '[1,2,3]'
  );
  assertEquals(EJSON.stringify([1, 2, 3], {indent: true}),
    '[\n  1,\n  2,\n  3\n]'
  );
  assertEquals(EJSON.stringify([1, 2, 3], {canonical: false}),
    '[1,2,3]'
  );
  assertEquals(EJSON.stringify([1, 2, 3], {indent: true, canonical: false}),
    '[\n  1,\n  2,\n  3\n]'
  );

  assertEquals(EJSON.stringify([1, 2, 3], {indent: 4}),
    '[\n    1,\n    2,\n    3\n]'
  );
  assertEquals(EJSON.stringify([1, 2, 3], {indent: '--'}),
    '[\n--1,\n--2,\n--3\n]'
  );

  assertEquals(
    EJSON.stringify(
      {b: [2, {d: 4, c: 3}], a: 1},
      {canonical: true}
    ),
    '{"a":1,"b":[2,{"c":3,"d":4}]}'
  );
  assertEquals(
    EJSON.stringify(
      {b: [2, {d: 4, c: 3}], a: 1},
      {
        indent: true,
        canonical: true,
      }
    ),
    '{\n' +
    '  "a": 1,\n' +
    '  "b": [\n' +
    '    2,\n' +
    '    {\n' +
    '      "c": 3,\n' +
    '      "d": 4\n' +
    '    }\n' +
    '  ]\n' +
    '}'
  );
  assertEquals(
    EJSON.stringify(
      {b: [2, {d: 4, c: 3}], a: 1},
      {canonical: false}
    ),
    '{"b":[2,{"d":4,"c":3}],"a":1}'
  );
  assertEquals(
    EJSON.stringify(
      {b: [2, {d: 4, c: 3}], a: 1},
      {indent: true, canonical: false}
    ),
    '{\n' +
    '  "b": [\n' +
    '    2,\n' +
    '    {\n' +
    '      "d": 4,\n' +
    '      "c": 3\n' +
    '    }\n' +
    '  ],\n' +
    '  "a": 1\n' +
    '}'
  );

  assertThrows(
    () => {
      const col = new Mongo.Collection('test');
      EJSON.stringify(col)
    },
    /Converting circular structure to JSON/
  );
});

Deno.test('ejson - parse', test => {
  assertEquals(EJSON.parse('[1,2,3]'), [1, 2, 3]);
  assertThrows(
    () => { EJSON.parse(null); },
    /argument should be a string/
  );
});

Deno.test("ejson - regexp", test => {
  assertEquals(EJSON.stringify(/foo/gi), "{\"$regexp\":\"foo\",\"$flags\":\"gi\"}");
  var d = new RegExp("foo", "gi");
  var obj = { $regexp: "foo", $flags: "gi" };

  var eObj = EJSON.toJSONValue(obj);
  var roundTrip = EJSON.fromJSONValue(eObj);
  assertEquals(obj, roundTrip);
});

Deno.test('ejson - custom types', test => {
  const testSameConstructors = (someObj, compareWith) => {
    assertEquals(someObj.constructor, compareWith.constructor);
    if (typeof someObj === 'object') {
      Object.keys(someObj).forEach(key => {
        const value = someObj[key];
        testSameConstructors(value, compareWith[key]);
      });
    }
  };

  const testReallyEqual = (someObj, compareWith) => {
    assertEquals(someObj, compareWith);
    testSameConstructors(someObj, compareWith);
  };

  const testRoundTrip = (someObj) => {
    const str = EJSON.stringify(someObj);
    const roundTrip = EJSON.parse(str);
    testReallyEqual(someObj, roundTrip);
  };

  const testCustomObject = (someObj) => {
    testRoundTrip(someObj);
    testReallyEqual(someObj, EJSON.clone(someObj));
  };

  const a = new EJSONTest.Address('Montreal', 'Quebec');
  testCustomObject( {address: a} );
  // Test that difference is detected even if they
  // have similar toJSONValue results:
  const nakedA = {city: 'Montreal', state: 'Quebec'};
  assertNotEquals(nakedA, a);
  assertNotEquals(a, nakedA);
  const holder = new EJSONTest.Holder(nakedA);
  assertEquals(holder.toJSONValue(), a.toJSONValue()); // sanity check
  assertNotEquals(holder, a);
  assertNotEquals(a, holder);

  const d = new Date();
  const obj = new EJSONTest.Person('John Doe', d, a);
  testCustomObject( obj );

  // Test clone is deep:
  const clone = EJSON.clone(obj);
  clone.address.city = 'Sherbrooke';
  assertNotEquals( obj, clone );
});

// Verify objects with a property named "length" can be handled by the EJSON
// API properly (see https://github.com/meteor/meteor/issues/5175).
Deno.test('ejson - handle objects with properties named "length"', test => {
  class Widget {
    constructor() {
      this.length = 10;
    }
  }
  const widget = new Widget();

  const toJsonWidget = EJSON.toJSONValue(widget);
  assertEquals({...widget}, toJsonWidget);

  const fromJsonWidget = EJSON.fromJSONValue(widget);
  assertEquals({...widget}, fromJsonWidget);

  const stringifiedWidget = EJSON.stringify(widget);
  assertEquals(stringifiedWidget, '{"length":10}');

  const parsedWidget = EJSON.parse('{"length":10}');
  assertEquals({ length: 10 }, parsedWidget);

  assertEquals(false, EJSON.isBinary(widget));

  const widget2 = new Widget();
  assertEquals(widget, widget2);

  const clonedWidget = EJSON.clone(widget);
  assertEquals({...widget}, clonedWidget);
});
