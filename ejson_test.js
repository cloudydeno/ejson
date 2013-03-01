Tinytest.add("ejson - keyOrderSensitive", function (test) {
  test.isTrue(EJSON.equals({
    a: {b: 1, c: 2},
    d: {e: 3, f: 4}
  }, {
    d: {f: 4, e: 3},
    a: {c: 2, b: 1}
  }));

  test.isFalse(EJSON.equals({
    a: {b: 1, c: 2},
    d: {e: 3, f: 4}
  }, {
    d: {f: 4, e: 3},
    a: {c: 2, b: 1}
  }, {keyOrderSensitive: true}));

  test.isFalse(EJSON.equals({
    a: {b: 1, c: 2},
    d: {e: 3, f: 4}
  }, {
    a: {c: 2, b: 1},
    d: {f: 4, e: 3}
  }, {keyOrderSensitive: true}));
});

Tinytest.add("ejson - nesting and literal", function (test) {
  var d = new Date;
  var obj = {$date: d};
  var eObj = EJSON.toJSONValue(obj);
  var roundTrip = EJSON.fromJSONValue(eObj);
  test.equal(obj, roundTrip);
});

Tinytest.add("ejson - equality and falsiness", function (test) {
  test.isTrue(EJSON.equals(null, null));
  test.isTrue(EJSON.equals(undefined, undefined));
  test.isFalse(EJSON.equals("foo", null));
  test.isFalse(EJSON.equals(null, "foo"));
  test.isFalse(EJSON.equals(undefined, "foo"));
  test.isFalse(EJSON.equals("foo", undefined));
});
