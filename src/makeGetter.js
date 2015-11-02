export default ({ name }) => (components, locals) => {
  const promises = components

    // Get component fetchers
    .map(component => component[name])

    // Filter out missing fetchers
    .filter(fetchers => fetchers)

    // Execute fetchers and store promises
    .map(fetcher => fetcher(locals));

  return Promise.all(promises);
};
