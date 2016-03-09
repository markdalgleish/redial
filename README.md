[![Build Status](https://img.shields.io/travis/markdalgleish/redial/master.svg?style=flat-square)](http://travis-ci.org/markdalgleish/redial) [![Coverage Status](https://img.shields.io/coveralls/markdalgleish/redial/master.svg?style=flat-square)](https://coveralls.io/r/markdalgleish/redial) [![npm](https://img.shields.io/npm/v/redial.svg?style=flat-square)](https://www.npmjs.com/package/redial)

# redial

Universal data fetching and route lifecycle management for React etc.

```bash
$ npm install --save redial
```

## Why?

When using something like [React Router](https://github.com/rackt/react-router), you'll want to ensure that all data for a set of routes is prefetched on the server before attempting to render.

However, as your application grows, you're likely to discover the need for more advanced route lifecycle management.

For example, you might want to separate mandatory data dependencies from those that are allowed to fail. You might want to defer certain data fetching operations to the client, particularly in the interest of server-side performance. You might also want to dispatch page load events once all data fetching has completed on the client.

In order to accommodate these scenarios, the ability to define and trigger your own custom route-level lifecycle hooks becomes incredibly important.

## Providing lifecycle hooks

The `@provideHooks` decorator allows you to define hooks for your custom lifecycle events, returning promises if any asynchronous operations need to be performed. When using something like React Router, you'll want to decorate your route handlers rather than lower level components.

For example:

```js
import { provideHooks } from 'redial';

import React, { Component } from 'react';
import { getSomething, getSomethingElse, trackDone } from 'actions/things';

@provideHooks({
  fetch: ({ dispatch, params: { id } }) => dispatch(getSomething(id)),
  defer: ({ dispatch, params: { id } }) => dispatch(getSomethingElse(id)),
  done: ({ dispatch }) => dispatch(trackDone())
})
class MyRouteHandler extends Component {
  render() {
    return <div>...</div>;
  }
}
```

If you'd prefer to avoid using decorators, you can use `provideHooks` as a plain old function:

```js
const hooks = {
  fetch: ({ dispatch, params: { id } }) => dispatch(getSomething(id)),
  defer: ({ dispatch, params: { id } }) => dispatch(getSomethingElse(id)),
  done: ({ dispatch }) => dispatch(trackDone())
};

class MyRouteHandler extends Component {
  render() {
    return <div>...</div>;
  }
}

export default provideHooks(hooks)(MyRouteHandler);
```

### Triggering lifecycle events

Once you've decorated your components, you can then use the `trigger` function to initiate an event for an arbitrary array of components, or even a single component if required. Since hooks tend to be asynchronous, this operation always returns a promise.

For example, when fetching data before rendering on the server:

```js
import { trigger } from 'redial';

const locals = {
  some: 'data',
  more: 'stuff'
};

trigger('fetch', components, locals).then(render);
```

### Dynamic locals

If you need to calculate different locals for each lifecycle hook, you can provide a function instead of an object. This function is then executed once per lifecycle hook, with a static reference to the component provided as an argument.

For example, this would allow you to calculate whether a component is being rendered for the first time and pass the result in via the locals object:

```js
const getLocals = component => ({
  isFirstRender: prevComponents.indexOf(component) === -1
});

trigger('fetch', components, getLocals).then(render);
```

## Example usage with React Router and Redux

When [server rendering with React Router](https://github.com/rackt/react-router/blob/master/docs/guides/ServerRendering.md) (or using the same technique to render on the client), the `renderProps` object provided to the `match` callback has an array of routes, each of which has a component attached. You're also likely to want to pass some information from the router to your lifecycle hooks.

In order to dispatch actions from within your hooks, you'll want to pass in a reference to your store's `dispatch` function. This works especially well with [redux-thunk](https://github.com/gaearon/redux-thunk) to ensure your async actions return promises.

### Example server usage

```js
import { trigger } from 'redial';

import React from 'react';
import { renderToString } from 'react-dom/server';
import { RouterContext, createMemoryHistory, match } from 'react-router';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';

// Your app's reducer and routes:
import reducer from './reducer';
import routes from './routes';

// Render the app server-side for a given path:
export default path => new Promise((resolve, reject) => {
  // Set up Redux (note: this API requires redux@>=3.1.0):
  const store = createStore(reducer, applyMiddleware(thunk));
  const { dispatch, getState } = store;

  // Set up history for router:
  const history = createMemoryHistory(path);

  // Match routes based on history object:
  match({ routes, history }, (error, redirectLocation, renderProps) => {
    // Get array of route handler components:
    const { components } = renderProps;

    // Define locals to be provided to all lifecycle hooks:
    const locals = {
      path: renderProps.location.pathname,
      query: renderProps.location.query,
      params: renderProps.params,

      // Allow lifecycle hooks to dispatch Redux actions:
      dispatch
    };

    // Wait for async data fetching to complete, then render:
    trigger('fetch', components, locals)
      .then(() => {
        const state = getState();
        const html = renderToString(
          <Provider store={store}>
            <RouterContext {...renderProps} />
          </Provider>
        );

        resolve({ html, state });
      })
      .catch(reject);
  });
});
```

### Example client usage

```js
import { trigger } from 'redial';

import React from 'react';
import { render } from 'react-dom';
import { Router, browserHistory, match } from 'react-router';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';

// Your app's reducer and routes:
import reducer from './reducer';
import routes from './routes';

// Render the app client-side to a given container element:
export default container => {
  // Your server rendered response needs to expose the state of the store, e.g.
  // <script>
  //   window.INITIAL_STATE = <%- require('serialize-javascript')(state)%>
  // </script>
  const initialState = window.INITIAL_STATE;

  // Set up Redux (note: this API requires redux@>=3.1.0):
  const store = createStore(reducer, initialState, applyMiddleware(thunk));
  const { dispatch } = store;

  // Listen for route changes on the browser history instance:
  browserHistory.listen(location => {
    // Match routes based on location object:
    match({ routes, location }, (error, redirectLocation, renderProps) => {
      // Get array of route handler components:
      const { components } = renderProps;

      // Define locals to be provided to all lifecycle hooks:
      const locals = {
        path: renderProps.location.pathname,
        query: renderProps.location.query,
        params: renderProps.params,

        // Allow lifecycle hooks to dispatch Redux actions:
        dispatch
      };

      // Don't fetch data for initial route, server has already done the work:
      if (window.INITIAL_STATE) {
        // Delete initial data so that subsequent data fetches can occur:
        delete window.INITIAL_STATE;
      } else {
        // Fetch mandatory data dependencies for 2nd route change onwards:
        trigger('fetch', components, locals);
      }

      // Fetch deferred, client-only data dependencies:
      trigger('defer', components, locals);
    });
  });

  // Render app with Redux and router context to container element:
  render((
    <Provider store={store}>
      <Router history={browserHistory} routes={routes} />
    </Provider>
  ), container);
};
```

## Boilerplates using redial

- [React Production Starter](https://github.com/jaredpalmer/react-production-starter) by [@jaredpalmer](https://twitter.com/jaredpalmer)

## Related projects

- [React Resolver](https://github.com/ericclemmons/react-resolver) by [@ericclemmons](https://twitter.com/ericclemmons)
- [React Transmit](https://github.com/RickWong/react-transmit) by [@rygu](https://twitter.com/rygu)
- [AsyncProps for React Router](https://github.com/rackt/async-props) by [@ryanflorence](https://twitter.com/ryanflorence)
- [GroundControl](https://github.com/raisemarketplace/ground-control) by [@nickdreckshage](https://twitter.com/nickdreckshage)
- [React Async](https://github.com/andreypopp/react-async) by [@andreypopp](https://twitter.com/andreypopp)

## License

[MIT License](http://markdalgleish.mit-license.org/)
