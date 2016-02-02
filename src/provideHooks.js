export default handlers => ComposedComponent => {
  ComposedComponent.__redial_handlers__ = handlers;
  return ComposedComponent;
};
