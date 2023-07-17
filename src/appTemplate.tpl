import React, { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, useRouteError } from "react-router-dom";

// @ts-ignore
import { AppContextProvider } from "express-route-register/client/provider";

{{imports}}

declare global {
  let __context: any;
}

type Props = {
  routes: { path: string, Component?: any, element?: any }[],
  data: any
}

function ErrorBoundary() {
  let error = useRouteError();
  // Uncaught ReferenceError: path is not defined
  return <div>Error: {error?.toString()}</div>;
}

function ClientApp(props: Props) {
  let router = createBrowserRouter(
      props.routes.map((r) => ({
        path: r.path,
        element: r.element,
        Component: r.Component,
        errorElement: <ErrorBoundary />,
      }))
  );


  const Children = <AppContextProvider router={router} serverData={props.data}>{{htmlComponent}}</AppContextProvider>;

  if (typeof __context !== "undefined") {
    return (<__context.Provider value={props.data}>{Children}</__context.Provider>)
  }


  return <>{Children}</>
}

const routes = [{{routes}}]
const serverData = JSON.parse(document.querySelector("#ssr-data")?.innerHTML || "{}");

hydrateRoot(document, <ClientApp routes={routes} data={serverData} />)