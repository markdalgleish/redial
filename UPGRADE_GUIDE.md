# Upgrade Guide

## v0.4.0

- The project was renamed from `react-fetcher` to `redial`.

- `@prefetch` and `@defer` have been deprecated in favour of `@provideHooks`.

  ```diff
  -import { prefetch, defer } from 'react-fetcher';
  +import { provideHooks } from 'redial';

  -@prefetch(() => { ... })
  -@defer(() => { ... })
  +provideHooks({
  +  fetch: () => { ... },
  +  defer: () => { ... }
  +})
  class MyRouteHandler extends Component {
    ...
  }
  ```

- `getPrefetchedData` and `getDeferredData` have been deprecated in favour of `trigger`.

  ```diff
  -import { getPrefetchedData, getDeferredData } from 'react-fetcher';
  +import { trigger } from 'redial';

  -getPrefetchedData(components, locals).then(() => { ... });
  +trigger('fetch', components, locals).then(() => { ... });

  -getDeferredData(components, locals).then(() => { ... });
  +trigger('defer', components, locals).then(() => { ... });
  ```
