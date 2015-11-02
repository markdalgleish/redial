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

## Usage with Flux

In order to dispatch actions from within your decorators, you'll want to pass in a reference to your `dispatch` function:

As an example, when using [Redux](https://github.com/rackt/redux):

```js
import { getPrefetchedData } from 'react-fetcher';
import { createStore } from 'redux';
import reducer from './reducer';

const store = createStore(reducer);
const { dispatch } = store;

getPrefetchedData({ dispatch }).then(render());
```

## Usage with React Router

When [server rendering with React Router](https://github.com/rackt/react-router/blob/master/docs/guides/advanced/ServerRendering.md) (or using the same technique to render on the client), the `renderProps` object provided to the `match` callback has an array of routes, each of which has a component attached. You're also likely to want to pass some information from the router to your decorator functions.

For example:

```js
import { getPrefetchedData } from 'react-fetcher';
import { match } from 'react-router';
import reducer from './reducer';

const store = createStore(reducer);
const { dispatch } = store;

match({ routes, location }, (routerError, redirectLocation, renderProps) => {
  const components = renderProps.routes.map(route => route.component);

  const fetcherData = {
    path: renderProps.location.pathname,
    query: renderProps.location.query,
    params: renderProps.params,
    dispatch
  };

  getPrefetchedData(components, fetcherData).then(render());
});
```

## License

[MIT License](http://markdalgleish.mit-license.org/)
