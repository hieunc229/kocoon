import Helmet from "react-helmet";

import { createElement } from "react";
import { AppContextProvider } from "./context";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

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

export default function ClientEntry(props: Props) {
  const routes = props.routes;
  const AppContainer = props.wrapper;
  const header = props.settings.assets ? (
    <Helmet>
      {props.settings.assets
        .filter((path: string) => path.endsWith(".css"))
        .map((path: string) => (
          <link key={`style-${path}`} rel="stylesheet" href={path} />
        ))}

      {/* {props.settings.assets
        .filter((path: string) => path.endsWith(".js"))
        .map((path: string) => (
          <script key={`script-${path}`} src={path}></script>
        ))} */}
    </Helmet>
  ) : undefined;

  if (props.settings.clientUseRouter) {
    const currentRoute =
      routes.find((item) => item.path === props.settings.path) || routes[0];

    // if (!currentRoute) {
    //   return <div>No component matched</div>;
    // }

    return (
      <AppContextProvider
        session={props.session}
        serverData={props.data}
        routes={routes}
      >
        {header}
        {currentRoute.element ||
          createElement(currentRoute.Component, currentRoute.props)}
      </AppContextProvider>
    );
  }

  const router = createBrowserRouter(routes);

  const Children = (
    <>
      <AppContextProvider
        router={router}
        session={props.session}
        serverData={props.data}
        routes={routes}
      >
        {header}
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
