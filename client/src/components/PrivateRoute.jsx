import React from 'react';
import { Route, Redirect } from 'react-router-dom';

// Mock function or import your auth utils to get user info
const getCurrentUser = () => {
  // Implement or import your auth logic
  // Example return { isAuthenticated: true, role: 'admin' }
};

const PrivateRoute = ({ component: Component, roles, ...rest }) => {
  const user = getCurrentUser();

  return (
    <Route
      {...rest}
      render={props => {
        if (!user || !user.isAuthenticated) {
          return <Redirect to={{ pathname: '/admin/Login', state: { from: props.location } }} />;
        }
        if (roles && roles.indexOf(user.role) === -1) {
          // Role not authorized
          return <Redirect to={{ pathname: '/' }} />;
        }
        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;