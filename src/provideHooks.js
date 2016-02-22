import propName from './propName';

export default hooks => ComposedComponent => {
  ComposedComponent[propName] = hooks;
  return ComposedComponent;
};
