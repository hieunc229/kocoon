import { Request as ExpressReq, Response } from "express";
import { StaticHandler } from "@remix-run/router";
import { renderToPipeableStream } from "react-dom/server";

import {
  StaticRouterProvider,
  createStaticRouter,
} from "react-router-dom/server";
import chalk from "chalk";
import { createFetchRequest } from "./utils";
import { isPromise } from "util/types";
import { createElement } from "react";
import { formatClassName } from "../utils/text";

export type ServerProps = {
  data?: any;
  status?: number;
  redirect?: string;
};

export type HandlerProps = {
  default: any;
  getServerProps?: (req: ExpressReq) => ServerProps | Promise<ServerProps>;
};

type ClientHandlerProps = {
  staticRoutes: any[];
  staticHandler: StaticHandler;
  AppComponent: any;
  route: string;
  clientUseRouter: boolean;
};

export function clientHandler(
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
  let serverData = null;

  const { handler } = options.handlerProps;
  const { AppComponent, route, staticHandler, clientUseRouter, staticRoutes } =
    options.props;

  if (handler.getServerProps) {
    const fn = handler.getServerProps(req);
    const {
      redirect,
      status,
      data: propsData,
    } = (isPromise(fn) ? await fn : fn) as ServerProps;

    if (status) {
      res.status(status);
    }

    if (redirect) {
      res.redirect(redirect);
      return;
    }

    serverData = propsData;
  }

  // If client already have router, server mustn't include a router
  let AppContainer = clientUseRouter
    ? getAppWithoutRouter({
        serverData,
        AppComponent,
        staticRoutes,
        req,
      })
    : await getAppWithRouter({
        serverData,
        AppComponent,
        staticHandler,
        req,
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
  staticRoutes: any[];
  serverData: any;
  AppComponent: any;
}) {
  const { staticRoutes, serverData, AppComponent } = props;

  let current = staticRoutes[0];

  return (
    <AppComponent data={serverData} settings={{ clientUseRouter: true }}>
      {current.Component ? createElement(current.Component) : current.element}
    </AppComponent>
  );
}

async function getAppWithRouter(props: {
  req: ExpressReq;
  staticHandler: StaticHandler;
  serverData: any;
  AppComponent: any;
}) {
  const { req, staticHandler, serverData, AppComponent } = props;
  const fetchRequest = createFetchRequest(req);
  const context: any = await staticHandler.query(fetchRequest);
  const router = createStaticRouter(staticHandler.dataRoutes, context);

  return (
    <AppComponent data={serverData}>
      <StaticRouterProvider context={context} router={router} />
    </AppComponent>
  );
}
