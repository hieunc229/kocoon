import { hot } from "react-hot-loader/root";

import { createElement } from "react";
import { AppContextProvider } from "./context";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Helmet from "react-helmet";

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
  const header = props.settings.assets ? (
    <Helmet>
      {props.settings.assets
        .filter((name: string) => name.endsWith(".css"))
        .map((name: string) => (
          <link key={`style-${name}`} rel="stylesheet" href={name} />
        ))}
    </Helmet>
  ) : undefined;

  if (props.settings.clientUseRouter) {
    const currentRoute =
      routes.find((item) => item.path === props.settings.path) || routes[0];

    // if (!currentRoute) {
    //   return <div>No component matched</div>;
    // }

    return (
      <>
        {header}
        {currentRoute.element ||
          createElement(currentRoute.Component, currentRoute.props)}
      </>
    );
  }

  const router = createBrowserRouter(routes);

  const Children = (
    <>
      {header}
      <AppContextProvider
        router={router}
        session={props.session}
        serverData={props.data}
        routes={routes}
      >
        <RouterProvider router={router} />
      </AppContextProvider>
    </>
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
