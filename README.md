[![Build Status](https://img.shields.io/travis/markdalgleish/react-fetcher/master.svg?style=flat-square)](http://travis-ci.org/markdalgleish/react-fetcher) [![npm](https://img.shields.io/npm/v/react-fetcher.svg?style=flat-square)](https://www.npmjs.com/package/react-fetcher)

# react-fetcher

Simple universal data fetching library for React.

```bash
$ npm install --save react-fetcher
```

## Why?

When using something like [React Router](https://github.com/rackt/react-router), you'll want to ensure that all data for a set of routes is prefetched on the server before attempting to render. You also might want to defer certain data fetching operations to the client, particularly in the interest of server-side performance.

## API

The `@prefetch` decorator is for universal data, while `@defer` is for data that is only required on the client. They each accept a function that returns a promise.

```js
import React, { Component } from 'react';
import { prefetch, defer } from 'react-fetcher';

@prefetch(({ dispatch }) => dispatch({ type: 'GET_PREFETCHED_DATA' })
@defer(({ dispatch }) => dispatch({ type: 'GET_DEFERRED_DATA' })
class MyComponent extends Component {
  render() {
    return <div>...</div>;
  }
}
```

Once you've decorated your components, you can then asynchronously fetch data for an arbitrary array of components.

```js
import { getPrefetchedData, getDeferredData } from 'react-fetcher';

// On server and client:
getPrefetchedData(components, { ... }).then(render());

// On client only:
getDeferredData(components, { ... }).then(render());
```

## Example Usage with React Router and Redux

When [server rendering with React Router](https://github.com/rackt/react-router/blob/master/docs/guides/advanced/ServerRendering.md) (or using the same technique to render on the client), the `renderProps` object provided to the `match` callback has an array of routes, each of which has a component attached. You're also likely to want to pass some information from the router to your decorator functions.

In order to dispatch actions from within your decorators, you'll want to pass in a reference to your store's `dispatch` function. This works especially well with [redux-thunk](https://github.com/gaearon/redux-thunk) to ensure your async actions return promises.

For example:

```js
import { getPrefetchedData } from 'react-fetcher';
import React from 'react';
import { renderToString } from 'react-dom/server';
import createMemoryHistory from 'history/lib/createMemoryHistory';
import useQueries from 'history/lib/useQueries';
import { RoutingContext, match } from 'react-router';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';

// Your app's reducer and routes:
import reducer from './reducer';
import routes from './routes';

// Render the app server-side for a given path:
export default path => new Promise((resolve, reject) => {
  // Set up Redux:
  const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);
  const store = createStoreWithMiddleware(reducer);
  const { dispatch } = store;

  // Set up history for router:
  const history = useQueries(createMemoryHistory)();
  const location = history.createLocation(path);

  // Match routes based on location object:
  match({ routes, location }, (routerError, redirectLocation, renderProps) => {
    // Get array of route components:
    const components = renderProps.routes.map(route => route.component);

    // Define locals to be provided to all fetcher functions:
    const locals = {
      path: renderProps.location.pathname,
      query: renderProps.location.query,
      params: renderProps.params,

      // Allow fetcher functions to dispatch Redux actions:
      dispatch
    };

    // Wait for async actions to complete, then render:
    getPrefetchedData(components, locals)
      .then(() => {
        const data = store.getState();
        const html = renderToString(
          <Provider store={store}>
            <RoutingContext {...renderProps} />
          </Provider>
        );

        resolve({ data, html });
      })
      .catch(reject);
  });
});
```

## License

[MIT License](http://markdalgleish.mit-license.org/)
