export default (name, components, locals) => {
  const promises = (Array.isArray(components) ? components : [components])

    // Filter out falsy components
    .filter(component => component)

    // Get component lifecycle handler functions
    .map(component => ({ component, handlers: component.__redial_handlers__ }))

    // Filter out components that haven't been decorated
    .filter(({ handlers }) => handlers)

    // Calculate locals if required, execute handlers and store promises
    .map(({ component, handlers }) => {
      const handler = handlers[name];

      if (typeof handler !== 'function') {
        return;
      }

      return typeof locals === 'function' ?
        handler(locals(component)) :
        handler(locals)
    });

  return Promise.all(promises);
};
