import makeGetter from './makeGetter';
import makeDecorator from './makeDecorator';

const prefetchName = 'fetchers';
const deferName = 'deferredFetchers';

export default {
  getPrefetchedData: makeGetter({ name: prefetchName }),
  prefetch: makeDecorator({ name: prefetchName }),

  getDeferredData: makeGetter({ name: deferName }),
  defer: makeDecorator({ name: deferName })
};
