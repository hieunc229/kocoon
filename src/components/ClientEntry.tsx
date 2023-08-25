import { createElement } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppContextProvider } from "./context";
import { hot } from "react-hot-loader/root";

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
  context?: any;
};

function ClientApp(props: Props) {
  const routes = props.routes;
  const context = props.context;

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
    >
      <RouterProvider router={router} />
    </AppContextProvider>
  );

  if (context) {
    return (
      <context.Provider session={props.session} value={props.data}>
        {Children}
      </context.Provider>
    );
  }

  return <>{Children}</>;
}

export default process.env.NODE_ENV === "development" ? hot(ClientApp) : ClientApp;