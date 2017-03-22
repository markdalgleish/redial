import propName from './propName';

const getPromises = (name, components, locals) => {

  const promises = [];

  (Array.isArray(components) ? components : [components])
    .filter(component => component)

    .map(component => ({component, hooks: component[propName]}))

    .filter(({hooks}) => hooks)

    .forEach(({component, hooks}) => {
      const hook = hooks[name]
      const children = hooks['components']
      if (typeof hook === 'function') {
        try {
          promises.push(typeof locals === 'function' ?
            hook(locals(component)) :
            hook(locals))
        } catch (err) {
          promises.push(Promise.reject(err))
        }
      }
      if (typeof children !== 'undefined' && children) {
        getPromises(name, (Array.isArray(children) ? children : [children]), locals).forEach(promise => {
          promises.push(promise)
        })
      }
    });

  return promises;
}

const trigger = (name, components, locals) => {
  return Promise.all(getPromises(name, components, locals));
}

export default trigger
