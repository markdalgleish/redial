export default ({ name }) => (components, locals) => {
  const promises = (Array.isArray(components) ? components : [components])

    // Get component fetcher functions
    .map(component => (component && { component, fetcher: component[name] }))

    // Filter out components that haven't been decorated
    .filter(({ fetcher }) => fetcher)

    // Calculate locals if required, execute fetchers and store promises
    .map(({ component, fetcher }) => typeof locals === 'function' ?
      fetcher(locals(component)) :
      fetcher(locals)
    );

  return Promise.all(promises);
};
