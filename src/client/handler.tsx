import React from "react";

import {renderToPipeableStream} from "react-dom/server";
import {Request, Response} from "express";

export type ServerProps = {
  data?: any;
  status?: number;
  redirect?: string;
};

type HandlerProps = {
  default: any;
  getServerProps?: (req: Request) => ServerProps | Promise<ServerProps>;
};

export function clientHandler(handlers: HandlerProps) {
  return function (req: Request, res: Response) {
    handler(handlers, req, res);
  };
}

function isPromise(p: any) {
  if (typeof p === "object" && typeof p.then === "function") {
    return true;
  }

  return false;
}

async function handler(handlers: HandlerProps, req: Request, res: Response) {
  let data = null;

  if (handlers.getServerProps) {
    const fn = handlers.getServerProps(req);
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

    data = propsData;
  }

  const component = handlers.default;

  const {pipe} = renderToPipeableStream(
    React.createElement(App, {component, data}),
    {
      bootstrapScripts: ["/main.js"],
      onShellReady() {
        res.setHeader("content-type", "text/html");
        pipe(res);
      },
    }
  );
}

function App(props: {data: any; component: any}) {
  const {data, component} = props;
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles.css"></link>
        <title>Fullstack React with Fresh</title>
        
      </head>

      <body>
        {React.createElement(component)}
        <div id="ssr-data" style={{display: "none"}}>
          {JSON.stringify(data)}
        </div>
      </body>
    </html>
  );
}
