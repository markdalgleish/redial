import React from 'react';

export default ({ name }) => fetchers => ComposedComponent => {
  ComposedComponent[name] = fetchers;
  return ComposedComponent;
};
