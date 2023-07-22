import { Request as ExpressReq, Response } from "express";
import { StaticHandler } from "@remix-run/router";
import { renderToPipeableStream } from "react-dom/server";

import {
  StaticRouterProvider,
  createStaticRouter,
} from "react-router-dom/server";

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
  AppComponent: any,
  route: string
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
  req: ExpressReq,
  res: Response
) {
  let serverData = null;

  const { handler } = options.handlerProps;
  const { staticHandler, AppComponent, route } = options.props;

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

  const fetchRequest = createFetchRequest(req);
  const context: any = await staticHandler.query(fetchRequest);
  const router = createStaticRouter(staticHandler.dataRoutes, context);
  
  const { pipe } = renderToPipeableStream(
    <AppComponent data={serverData}>
      <StaticRouterProvider context={context} router={router} />
    </AppComponent>,
    {
      bootstrapScripts: [`${route.replace("/", "_")}.js`],
      onShellReady() {
        res.setHeader("content-type", "text/html");
        pipe(res);
      },
      onError(err, info) {
        console.log("Failed to render", {err, info});
        res.status(500).send(err)
      },
    }
  );
}

function createFetchRequest(req: ExpressReq) {
  let origin = `${req.protocol}://${req.get("host")}`;
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
