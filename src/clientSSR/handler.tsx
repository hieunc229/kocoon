import chalk from "chalk";

import { Request as ExpressReq, Response } from "express";
import { StaticHandler } from "@remix-run/router";
import { renderToPipeableStream } from "react-dom/server";
import { createFetchRequest } from "./utils";
import { isPromise } from "util/types";
import { createElement } from "react";
import { formatClassName } from "../utils/text";
import { RouteObject } from "react-router-dom";
import { excludeRegex, getLayoutRoute } from "../utils/route";

import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from "react-router-dom/server";

type ClientHandlerProps = {
  staticRoutes: RouteObject[];
  staticHandler: StaticHandler;
  AppComponent: any;
  route: string;
  clientUseRouter: boolean;
  routes: { [path: string]: ClientRouteProps };
};

export default function createClientSSRRequest(
  handlerProps: {
    handler: HandlerProps;
    layout?: HandlerProps;
  },
  props: ClientHandlerProps
) {
  return function (req: ExpressReq, res: Response) {
    handleRequest(
      {
        handlerProps,
        props,
      },
      req,
      res
    );
  };
}

async function handleRequest(
  options: {
    handlerProps: {
      handler: HandlerProps;
      layout?: HandlerProps;
    };
    props: ClientHandlerProps;
  },
  req: ExpressReq,
  res: Response
) {
  const { handler } = options.handlerProps;
  const { AppComponent, route, routes, clientUseRouter } = options.props;

  let serverData = null;
  let globalData = null;
  let routeProps = null;

  if (handler.getServerProps) {
    const fn = handler.getServerProps(req);
    const {
      redirect,
      status,
      props: __routeProps,
      data: __serverData,
      globalData: __globalData,
    } = (isPromise(fn) ? await fn : fn) as ServerProps;

    if (status) {
      res.status(status);
    }

    if (redirect) {
      res.redirect(redirect);
      return;
    }

    globalData = __globalData;
    serverData = __serverData;
    routeProps = __routeProps;
  }

  const staticRoutes: RouteObject[] = [];
  const routeEntries = Object.entries(routes).filter(
    (item) => !excludeRegex.test(item[0])
  );
  for (const [route, { handler }] of routeEntries) {
    const layoutHandler = getLayoutRoute(route, routes);
    let props = req.route.path === route ? routeProps : null;
    if (layoutHandler?.layout) {
      staticRoutes.push({
        path: route,
        element: createElement(
          layoutHandler.layout.default,
          handler.layoutProps,
          createElement(handler.default, props)
        ),
      });
    } else {
      staticRoutes.push({
        path: route,
        element: createElement(handler.default, props),
      });
    }
  }

  const staticHandler = createStaticHandler(staticRoutes);

  // If client already have router, server mustn't include a router
  let AppContainer = clientUseRouter
    ? getAppWithoutRouter({
        serverData,
        AppComponent,
        staticRoutes,
        globalData,
        req,
        routeProps,
      })
    : await getAppWithRouter({
        serverData,
        AppComponent,
        staticHandler,
        globalData,
        req,
        routeProps,
      });

  const { pipe } = renderToPipeableStream(AppContainer, {
    bootstrapScripts: [`/static/${formatClassName(route)}.js`],
    onShellReady() {
      res.setHeader("content-type", "text/html");
      pipe(res);
    },
    onError(err: any, info) {
      console.log(chalk.red("Failed to render"), { err, info });
      res.status(500).send(err.toString());
    },
  });
}

function getAppWithoutRouter(props: {
  req: ExpressReq;
  staticRoutes: RouteObject[];
  serverData: any;
  globalData: any;
  AppComponent: any;
  routeProps: any;
}) {
  const {
    req,
    staticRoutes,
    serverData,
    AppComponent,
    globalData,
    routeProps,
  } = props;

  let current =
    staticRoutes.find((item) => item.path === req.route.path) ||
    staticRoutes[0];

  return (
    <AppComponent
      data={serverData}
      globalData={globalData}
      session={null}
      routeProps={{ [req.route.path]: { props: routeProps } }}
      settings={{ clientUseRouter: true, path: req.route.path }}
    >
      {current.Component
        ? createElement(current.Component, routeProps)
        : current.element}
    </AppComponent>
  );
}

async function getAppWithRouter(props: {
  req: ExpressReq;
  staticHandler: StaticHandler;
  serverData: any;
  globalData: any;
  AppComponent: any;
  routeProps: any;
}) {
  const {
    req,
    staticHandler,
    serverData,
    AppComponent,
    globalData,
    routeProps,
  } = props;
  const fetchRequest = createFetchRequest(req);
  const context: any = await staticHandler.query(fetchRequest);
  const router = createStaticRouter(staticHandler.dataRoutes, context);

  return (
    <AppComponent
      routeProps={{ [req.route.path]: { props: routeProps } }}
      globalData={globalData}
      session={null}
      data={serverData}
    >
      <StaticRouterProvider context={context} router={router} />
    </AppComponent>
  );
}
