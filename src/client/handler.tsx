import React from "react";

import { renderToPipeableStream } from "react-dom/server";
import { Request, Response } from "express";
import { AppContextProvider } from "./provider";
import { StaticHandler } from "@remix-run/router";

import {
  StaticRouter,
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from "react-router-dom/server";

export type ServerProps = {
  data?: any;
  status?: number;
  redirect?: string;
};

export type HandlerProps = {
  default: any;
  getServerProps?: (req: Request) => ServerProps | Promise<ServerProps>;
};

type ClientHandlerProps = {
  staticRoutes: any[];
  staticHandler: StaticHandler;
};

export function clientHandler(
  handlerProps: {
    handler: HandlerProps;
    layout?: HandlerProps;
  },
  props: ClientHandlerProps
) {
  return function (req: Request, res: Response) {
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

function isPromise(p: any) {
  if (typeof p === "object" && typeof p.then === "function") {
    return true;
  }

  return false;
}

async function handleRequest(
  options: {
    handlerProps: {
      handler: HandlerProps;
      layout?: HandlerProps;
    };
    props: ClientHandlerProps;
  },
  req: Request,
  res: Response
) {
  let serverData = null;

  const { props } = options;
  const { handler } = options.handlerProps;

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

  const statichandler = props.staticHandler;
  const fetchRequest = createFetchRequest(req);
  const context: any = await statichandler.query(fetchRequest);
  const router = createStaticRouter(statichandler.dataRoutes, context);

  const { pipe } = renderToPipeableStream(
    <App data={serverData}>
      <StaticRouterProvider context={context} router={router} />
    </App>,
    {
      bootstrapScripts: ["/bundle.js"],
      onShellReady() {
        res.setHeader("content-type", "text/html");
        pipe(res);
      },
    }
  );
}

function App(props: { data: any; children: any }) {
  const { data, children } = props;
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles.css" />
        <title>Fullstack React with Fresh</title>
      </head>
      <body>
        {
          <AppContextProvider serverData={data}>
            {/* {React.createElement(component)} */}
            {children}
          </AppContextProvider>
        }
        <div id="ssr-data" style={{ display: "none" }}>
          {JSON.stringify(data)}
        </div>
      </body>
    </html>
  );
}

function createFetchRequest(req: Request) {
  let origin = `${req.protocol}://${req.get("host")}`;
  // Note: This had to take originalUrl into account for presumably vite's proxying
  let url = new URL(req.originalUrl || req.url, origin);

  let controller = new AbortController();
  req.on("close", () => controller.abort());

  let headers = new Headers();

  for (let [key, values] of Object.entries(req.headers)) {
    if (values) {
      if (Array.isArray(values)) {
        for (let value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  let init: any = {
    method: req.method,
    headers,
    signal: controller.signal,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
  }

  return new Request(url.href, init);
}
