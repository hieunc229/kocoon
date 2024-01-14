import { hot } from "react-hot-loader/root";

import { createElement, useLayoutEffect, useState } from "react";
import { createBrowserRouter, RouterProvider, useLocation } from "react-router-dom";
import { AppContextProvider } from "./context";

type Props = {
  routes: {
    path: string;
    Component?: any;
    element?: any;
    props?: any;
  }[];
  data: any;
  settings: any;
  session: any;
  routeProps: any;
  wrapper?: any;
};

function ClientApp(props: Props) {
  const routes = props.routes;
  const AppContainer = props.wrapper;
  if (props.settings.clientUseRouter) {
    const currentRoute = routes.find(
      (item) => item.path === props.settings.path
    );

    if (!currentRoute) {
      return <div>No component matched</div>;
    }

    return (
      currentRoute.element ||
      createElement(currentRoute.Component, currentRoute.props)
    );
  }

  const router = createBrowserRouter(routes);

  const Children = (
    <AppContextProvider
      router={router}
      session={props.session}
      serverData={props.data}
      routes={routes}
    >
      <RouterProvider router={router} />
    </AppContextProvider>
  );

  if (AppContainer) {
    return (
      <AppContainer session={props.session} value={props.data}>
        {Children}
      </AppContainer>
    );
  }

  return <>{Children}</>;
}

export default process.env.NODE_ENV === "development"
  ? hot(ClientApp)
  : ClientApp;
