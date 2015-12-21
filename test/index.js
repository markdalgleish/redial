import { assert } from 'chai';
import { spy, stub } from 'sinon';
import React, { Component } from 'react';
import { prefetch, defer, getPrefetchedData, getDeferredData } from '../src';

const makeTestObject = ({ decorator }) => {
  let object = {};

  const prefetchPromise = new Promise((resolve, reject) => {
    object.resolve = resolve;
    object.reject = reject;
  });
  object.stub = stub().returns(prefetchPromise);

  // Ensure both decorators can be used together
  const otherDecorator = decorator === prefetch ? defer : prefetch;

  @otherDecorator(() => Promise.resolve())
  @decorator(object.stub)
  class TestComponent extends Component {
    render() { return <div />; }
  }

  object.component = TestComponent;
  return object;
};

describe('Given a series of components have been decorated with prefetchers', () => {

  let prefetch_a, prefetch_b;

  beforeEach(() => {
    prefetch_a = makeTestObject({ decorator: prefetch });
    prefetch_b = makeTestObject({ decorator: prefetch });
  });

  describe('When the prefetched data is requested', () => {

    let resolveSpy, rejectSpy;

    beforeEach(() => {
      resolveSpy = spy();
      rejectSpy = spy();
      getPrefetchedData([ prefetch_a.component, prefetch_b.component ], { some: 'data' })
        .then(resolveSpy, rejectSpy);
    });

    it('Then the prefetchers should have locals passed to them', () => {
      assert.deepEqual(prefetch_a.stub.getCall(0).args[0], { some: 'data' });
      assert.deepEqual(prefetch_b.stub.getCall(0).args[0], { some: 'data' });
    });

    describe('And the prefetcher promises are resolved', () => {

      beforeEach(done => {
        prefetch_a.resolve();
        prefetch_b.resolve();
        setImmediate(done);
      });

      it('Then the prefetch data promise should also be resolved', () => {
        assert.equal(resolveSpy.callCount, 1);
        assert.equal(rejectSpy.callCount, 0);
      });

    });

    describe('And a prefetcher promise is rejected', () => {

      beforeEach(done => {
        prefetch_a.resolve();
        prefetch_b.reject();
        setImmediate(done);
      });

      it('Then the prefetch data promise should also be rejected', () => {
        assert.equal(resolveSpy.callCount, 0);
        assert.equal(rejectSpy.callCount, 1);
      });

    });

  });

  describe('When the prefetched data is requested with a locals function', () => {

    let resolveSpy, rejectSpy;

    beforeEach(() => {
      resolveSpy = spy();
      rejectSpy = spy();
      let callCount = 0;
      const getLocals = component => ({ component, callCount: ++callCount });
      getPrefetchedData([ prefetch_a.component, prefetch_b.component ], getLocals)
        .then(resolveSpy, rejectSpy);
    });

    it('Then the prefetchers should have the correct locals passed to them', () => {
      assert.deepEqual(prefetch_a.stub.getCall(0).args[0], { component: prefetch_a.component, callCount: 1 });
      assert.deepEqual(prefetch_b.stub.getCall(0).args[0], { component: prefetch_b.component, callCount: 2 });
    });

  });

  describe('When the prefetched data is requested for a single component', () => {

    let resolveSpy, rejectSpy;

    beforeEach(() => {
      resolveSpy = spy();
      rejectSpy = spy();
      getPrefetchedData(prefetch_a.component, { some: 'data' })
        .then(resolveSpy, rejectSpy);
    });

    it('Then the prefetcher should have locals passed to it', () => {
      assert.deepEqual(prefetch_a.stub.getCall(0).args[0], { some: 'data' });
    });

    describe('And the prefetcher promise is resolved', () => {

      beforeEach(done => {
        prefetch_a.resolve();
        setImmediate(done);
      });

      it('Then the prefetch data promise should also be resolved', () => {
        assert.equal(resolveSpy.callCount, 1);
        assert.equal(rejectSpy.callCount, 0);
      });

    });

  });

});

describe('Given a series of components have been decorated with deferred fetchers', () => {

  let defer_a, defer_b;

  beforeEach(() => {
    defer_a = makeTestObject({ decorator: defer });
    defer_b = makeTestObject({ decorator: defer });
  });

  describe('When the prefetched data is requested', () => {

    let resolveSpy, rejectSpy;

    beforeEach(() => {
      resolveSpy = spy();
      rejectSpy = spy();
      getDeferredData([ defer_a.component, defer_b.component ], { some: 'data' })
        .then(resolveSpy, rejectSpy);
    });

    it('Then the prefetchers should have locals passed to them', () => {
      assert.deepEqual(defer_a.stub.getCall(0).args[0], { some: 'data' });
      assert.deepEqual(defer_b.stub.getCall(0).args[0], { some: 'data' });
    });

    describe('And the prefetcher promises are resolved', () => {

      beforeEach(done => {
        defer_a.resolve();
        defer_b.resolve();
        setImmediate(done);
      });

      it('Then the prefetch data promise should also be resolved', () => {
        assert.equal(resolveSpy.callCount, 1);
        assert.equal(rejectSpy.callCount, 0);
      });

    });

    describe('And a prefetcher promise is rejected', () => {

      beforeEach(done => {
        defer_a.resolve();
        defer_b.reject();
        setImmediate(done);
      });

      it('Then the prefetch data promise should also be rejected', () => {
        assert.equal(resolveSpy.callCount, 0);
        assert.equal(rejectSpy.callCount, 1);
      });

    });

  });

});

describe('Given a component without any decorators applied', () => {

  let component, callbackSpy;

  beforeEach(() => {
    component = class MyComponent extends Component {
      render() { return <div />; }
    };
  });

  describe('When prefetched data is attempted to be fetched for the component', () => {

    beforeEach(done => {
      callbackSpy = spy();

      getPrefetchedData(component, { some: 'data' }).then(callbackSpy);

      setImmediate(done);
    });

    it('Then the promise should still be resolved', () => {
      assert.equal(callbackSpy.callCount, 1);
    });

  });

  describe('When deferred data is attempted to be fetched for the component', () => {

    beforeEach(done => {
      callbackSpy = spy();

      getDeferredData(component, { some: 'data' }).then(callbackSpy);

      setImmediate(done);
    });

    it('Then the promise should still be resolved', () => {
      assert.equal(callbackSpy.callCount, 1);
    });

  });

});
