import chalk from "chalk";
import path from "path";

import fs from "fs";
import { createElement } from "react";
import { Request, Response } from "express";
import { renderToPipeableStream } from "react-dom/server";

import { formatClassName } from "../utils/text";
import { getAppComponent } from "../clientSSR/generator";
import { isPromise } from "util/types";

export function clientSPAHandler(props: RumboRegisterClientSPAProps) {
  const {
    app,
    debug = false,
    route,
    publicPath = "",
    rootDir,
    clientUseRouter,
  } = props;

  const { default: AppComponent } = getAppComponent({
    publicPath,
    route,
    debug,
    rootDir,
  });

  let getServerProps: any = null;
  try {
    const meta = require(path.join(props.location, "_routeMeta"));
    getServerProps = meta.getServerProps;
  } catch (err) {}

  app.get(`${route}*`, async function (req: Request, res: Response) {
    let serverData = null;
    let globalData = null;
    let routeProps = null;
    if (getServerProps) {
      const fn = getServerProps(req);

      const {
        redirect,
        status,
        json,
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

      globalData = __globalData;
      serverData = { [req.path]: __serverData };
      routeProps = __routeProps;
    }

    const { pipe } = renderToPipeableStream(
      createElement(AppComponent, {
        settings: { clientUseRouter, path: req.path },
        globalData,
        serverData,
        // routeProps,
      }),
      {
        bootstrapScripts: [`/static/${formatClassName(route)}.js`],
        onShellReady() {
          res.setHeader("content-type", "text/html");
          pipe(res);
        },
        onError(err: any, info) {
          console.log(chalk.red("Failed to render"), { err, info });
          res.status(500).send(err.toString());
        },
      }
    );
  });
}
