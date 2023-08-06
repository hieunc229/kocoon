import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, useRouteError } from "react-router-dom";

import { AppContextProvider } from "rumbo/context";

{{imports}}

const __context = null;
type Props = {
  routes: { 
    path: string, 
    Component?: any,
    element?: any,
    props?: any
  }[],
  data: any,
  settings: any,
  session: any,
  routeProps: any
}

function ErrorBoundary() {
  let error = useRouteError();
  // Uncaught ReferenceError: path is not defined
  return <div>Error: {error?.toString()}</div>;
}

function ClientApp(props: Props) {
  
  const routes = props.routes;

  if (props.settings.clientUseRouter) {
    const currentRoute = routes.find(item => item.path === props.settings.path);
    return currentRoute.element || createElement(currentRoute.Component, currentRoute.props)
  }

  const router = createBrowserRouter(routes);
  const Children = <AppContextProvider router={router} session={props.session} serverData={props.data}>{{htmlComponent}}</AppContextProvider>;

  if (__context) {
    return (<__context.Provider session={props.session} value={props.data}>{Children}</__context.Provider>)
  }


  return <>{Children}</>
}


if (typeof document !== "undefined") {
  const root = document.querySelector("#root");
  if (root) {
    const {data={},settings={},globalData={}, session={},routeProps={}} = JSON.parse(document.querySelector("#ssr-data")?.innerHTML || "{}");
    const routes = [{{routes}}];

    globalData && Object.entries(globalData).forEach(([k,v]) => window[k] = v);
    hydrateRoot(root, <ClientApp routes={routes} settings={settings} routeProps={routeProps} session={session} data={data} />);
  }
}
