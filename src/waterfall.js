import getHookedComponents from './getHookedComponents'

export default (name, components, locals) =>  getHookedComponents(components)

  // Calculate locals if required, execute hooks and chain promises
  .reduce((promise, { component, hooks }) => {
    const hook = hooks[name];

    if (typeof hook !== 'function') {
      return promise;
    }

    return promise.then(() => {
      return typeof locals === 'function' ?
        hook(locals(component)) :
        hook(locals)
    })
  }, Promise.resolve());
