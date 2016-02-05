import { assert } from 'chai';
import { spy, stub } from 'sinon';
import React, { Component } from 'react';
import { provideHooks, trigger } from '../src';

const makeTestObject = (hookName) => {
  let object = {};

  const prefetchPromise = new Promise((resolve, reject) => {
    object.resolve = resolve;
    object.reject = reject;
  });
  object.stub = stub().returns(prefetchPromise);

  @provideHooks({ [hookName]: object.stub })
  class TestComponent extends Component {
    render() { return <div />; }
  }

  object.component = TestComponent;
  return object;
};

describe('Given a series of components have been decorated with hooks', () => {

  let hook_a, hook_b;

  beforeEach(() => {
    hook_a = makeTestObject('foobar');
    hook_b = makeTestObject('foobar');
  });

  describe('When a handled lifecycle event is triggered', () => {

    let resolveSpy, rejectSpy;

    beforeEach(() => {
      const componentsWithFalsyValues = [
        undefined,
        hook_a.component,
        null,
        hook_b.component,
        false
      ];

      resolveSpy = spy();
      rejectSpy = spy();

      trigger('foobar', componentsWithFalsyValues, { some: 'data' })
        .then(resolveSpy, rejectSpy);
    });

    it('Then the hooks should have locals passed to them', () => {
      assert.deepEqual(hook_a.stub.getCall(0).args[0], { some: 'data' });
      assert.deepEqual(hook_b.stub.getCall(0).args[0], { some: 'data' });
    });

    describe('And the hook promises are resolved', () => {

      beforeEach(done => {
        hook_a.resolve();
        hook_b.resolve();
        setImmediate(done);
      });

      it('Then the lifecycle event promise should also be resolved', () => {
        assert.equal(resolveSpy.callCount, 1);
        assert.equal(rejectSpy.callCount, 0);
      });

    });

    describe('And a hook promise is rejected', () => {

      beforeEach(done => {
        hook_a.resolve();
        hook_b.reject();
        setImmediate(done);
      });

      it('Then the lifecycle event promise should also be rejected', () => {
        assert.equal(resolveSpy.callCount, 0);
        assert.equal(rejectSpy.callCount, 1);
      });

    });

  });

  describe('When a handled lifecycle event is triggered with a locals function', () => {

    let resolveSpy, rejectSpy;

    beforeEach(() => {
      resolveSpy = spy();
      rejectSpy = spy();
      let callCount = 0;
      const getLocals = component => ({ component, callCount: ++callCount });
      trigger('foobar', [ hook_a.component, hook_b.component ], getLocals)
        .then(resolveSpy, rejectSpy);
    });

    it('Then the hooks should have the correct locals passed to them', () => {
      assert.deepEqual(hook_a.stub.getCall(0).args[0], { component: hook_a.component, callCount: 1 });
      assert.deepEqual(hook_b.stub.getCall(0).args[0], { component: hook_b.component, callCount: 2 });
    });

  });

  describe('When a handled lifecycle event is triggered for a single component', () => {

    let resolveSpy, rejectSpy;

    beforeEach(() => {
      resolveSpy = spy();
      rejectSpy = spy();
      trigger('foobar', hook_a.component, { some: 'data' })
        .then(resolveSpy, rejectSpy);
    });

    it('Then the hook should have locals passed to it', () => {
      assert.deepEqual(hook_a.stub.getCall(0).args[0], { some: 'data' });
    });

    describe('And the hook promise is resolved', () => {

      beforeEach(done => {
        hook_a.resolve();
        setImmediate(done);
      });

      it('Then the lifecycle event promise should also be resolved', () => {
        assert.equal(resolveSpy.callCount, 1);
        assert.equal(rejectSpy.callCount, 0);
      });

    });

  });

  describe('When an unhandled lifecycle event is triggered for a single component', () => {

    let resolveSpy, rejectSpy;

    beforeEach(() => {
      resolveSpy = spy();
      rejectSpy = spy();

      return trigger('unhandled', hook_a.component, { some: 'data' })
        .then(resolveSpy, rejectSpy);
    });

    it('Then the lifecycle event promise should also be resolved', () => {
      assert.equal(resolveSpy.callCount, 1);
      assert.equal(rejectSpy.callCount, 0);
    });

  });

  describe('When a lifecycle event is triggered for a falsy value', () => {

    let resolveSpy, rejectSpy;

    beforeEach(() => {
      resolveSpy = spy();
      rejectSpy = spy();

      return trigger('unhandled', null, { some: 'data' })
        .then(resolveSpy, rejectSpy);
    });

    it('Then the lifecycle event promise should also be resolved', () => {
      assert.equal(resolveSpy.callCount, 1);
      assert.equal(rejectSpy.callCount, 0);
    });

  });

});
