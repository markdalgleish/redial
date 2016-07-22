import getHookedComponents from './getHookedComponents'

export default (name, components, locals) => {
  const promises = getHookedComponents(components)

    // Calculate locals if required, execute hooks and store promises
    .map(({ component, hooks }) => {
      const hook = hooks[name];

      if (typeof hook !== 'function') {
        return;
      }

      return typeof locals === 'function' ?
        hook(locals(component)) :
        hook(locals)
    });

  return Promise.all(promises);
};
