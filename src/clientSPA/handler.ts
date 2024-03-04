import chalk from "chalk";
import path from "path";

import { createElement } from "react";
import { NextFunction, Request, Response } from "express";
import { renderToPipeableStream, renderToString } from "react-dom/server";

import { getAppEntry } from "../clientSSR/generator";
import { isPromise } from "util/types";
import type { StatsCompilation } from "webpack";
import { formatClassName } from "../utils/text";

export function clientSPAHandler(
  props: RumboRegisterClientSPAProps,
  statsJson?: StatsCompilation
) {
  const {
    app,
    debug = false,
    route,
    publicPath = "",
    rootDir,
    pwaEnabled = false,
    clientUseRouter,
    staticImports,
  } = props;

  let AppComponent: any;
  let getServerProps: any = null;

  if (staticImports) {
    AppComponent = staticImports.__rumboEntrySPA.staticImport.default;
    // _undefined is used when method is not defined
    getServerProps =
      staticImports[formatClassName(`${route}/__routeMeta_undefined`)]
        ?.staticImport.default;
  } else {
    const importedComponent = getAppEntry({
      publicPath,
      route,
      debug,
      rootDir,
      pwaEnabled,
    });
    AppComponent = importedComponent.default;

    try {
      const meta = require(path.join(props.location, "_routeMeta"));
      getServerProps = meta.getServerProps;
    } catch (err) {}
  }

  app.get(
    `${route}*`,
    async function (req: Request, res: Response, next: NextFunction) {
      if (!statsJson && res.locals.webpack) {
        statsJson = res.locals.webpack.devMiddleware.stats.toJson();
      }

      let serverData = null;
      let globalData = null;
      let routeProps = null;
      if (getServerProps) {
        const fn = getServerProps(req, res, next);

        const {
          redirect,
          status,
          json,
          props: __routeProps,
          data: __serverData,
          globalData: __globalData,
          next: __next,
        } = (isPromise(fn) ? await fn : fn) as ServerProps;

        if (status) {
          res.status(status);
        }

        if (__next) {
          return next();
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

      let AppContainer = createElement(AppComponent, {
        settings: {
          clientUseRouter,
          path: req.path,
          assets: statsJson?.assets
            // ?.filter((item) => item.name.endsWith(".css"))
            ?.map((item) => `/static/${item.name}`),
        },
        globalData,
        serverData,
      });

      renderToString(AppContainer);

      const { pipe } = renderToPipeableStream(AppContainer, {
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
  );
}
