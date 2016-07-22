import propName from './propName';

export default components => (Array.isArray(components) ? components : [components])

  // Filter out falsy components
  .filter(component => component)

  // Get component lifecycle hooks
  .map(component => ({ component, hooks: component[propName] }))

  // Filter out components that haven't been decorated
  .filter(({ hooks }) => hooks)
