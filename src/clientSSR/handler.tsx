import chalk from "chalk";

import { Request as ExpressReq, Response } from "express";
import { StaticHandler } from "@remix-run/router";
import {
  renderToPipeableStream,
  renderToStaticMarkup,
  renderToString,
} from "react-dom/server";
import { createFetchRequest } from "./utils";
import { isPromise } from "util/types";
import { createElement } from "react";
import { formatClassName } from "../utils/text";
import { RouteObject } from "react-router-dom";
import { excludeRegex, getLayoutRoute } from "../utils/route";

import React from "react";

import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from "react-router-dom/server";
import { StatsCompilation } from "webpack";

// Fix useLayoutEffect warning message on server
React.useLayoutEffect = React.useEffect;

type ClientHandlerProps = {
  staticRoutes: RouteObject[];
  staticHandler: StaticHandler;
  AppComponent: any;
  route: string;
  clientUseRouter: boolean;
  routes: { [path: string]: ClientRouteProps };
  statsJson?: StatsCompilation;
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
  const { AppComponent, staticRoutes, clientUseRouter } = options.props;

  // @ts-ignore
  let serverData: any = {
    __meta: {
      device: req.useragent
        ? (req.useragent.isMobile && "phone") ||
          (req.useragent.isDesktop && "desktop")
        : undefined,
    },
  };
  let globalData = null;
  let routeProps = null;

  let statsJson = options.props.statsJson;
  if (!statsJson && res.locals.webpack) {
    statsJson = res.locals.webpack.devMiddleware.stats.toJson();
  }

  if (handler.getServerProps) {
    const fn = handler.getServerProps(req as any);
    const {
      redirect,
      status,
      json,
      document,
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

    if (json) {
      return res.json(json);
    }

    if (document) {
      if (document.headers) {
        Object.entries(document.headers).forEach(([k, v]) => {
          res.setHeader(k, v);
        });
      }
      return res.send(document.content);
    }

    globalData = __globalData;
    routeProps = __routeProps;
    serverData[req.path] = __serverData;
  }

  const staticHandler = createStaticHandler(staticRoutes) as StaticHandler;
  const assets = statsJson?.assets?.map((item) => `/static/${item.name}`);

  const ClientContainer = clientUseRouter
    ? getAppWithoutRouter({
        serverData,
        AppComponent,
        staticRoutes,
        globalData,
        req,
        routeProps,
        settings: { clientUseRouter: true, path: req.route.path, assets },
      })
    : await getAppWithRouter({
        res,
        serverData,
        AppComponent,
        staticHandler,
        globalData,
        req,
        routeProps,
        settings: { assets },
      });

  renderToString(ClientContainer);

  const { pipe } = renderToPipeableStream(ClientContainer, {
    bootstrapScripts: statsJson?.assets
      ?.filter((item) => item.name.endsWith(".js"))
      .map((item) => `/static/${item.name}`),
    onAllReady() {
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
  ExtraComponent?: any;
  settings: any;
}) {
  const {
    req,
    staticRoutes,
    serverData,
    AppComponent,
    globalData,
    routeProps,
    ExtraComponent,
    settings,
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
      settings={settings}
    >
      {ExtraComponent || null}
      {current.Component
        ? createElement(current.Component, routeProps)
        : current.element}
    </AppComponent>
  );
}

async function getAppWithRouter(props: {
  req: ExpressReq;
  res: Response;
  staticHandler: StaticHandler;
  serverData: any;
  globalData: any;
  AppComponent: any;
  routeProps: any;
  ExtraComponent?: any;
  settings: any;
}) {
  const {
    req,
    res,
    staticHandler,
    serverData,
    AppComponent,
    globalData,
    routeProps,
    ExtraComponent,
    settings,
  } = props;

  const { query, dataRoutes } = createStaticHandler(staticHandler.dataRoutes);
  const fetchReq = createFetchRequest(req, res);
  const context = (await query(fetchReq)) as any;
  const router = createStaticRouter(dataRoutes, context);

  return (
    <AppComponent
      routeProps={{ [req.route.path]: { props: routeProps } }}
      globalData={globalData}
      session={null}
      data={serverData}
      settings={settings}
    >
      {ExtraComponent || null}
      <StaticRouterProvider context={context} router={router} />
    </AppComponent>
  );
}
