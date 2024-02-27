import chalk from "chalk";
import path from "path";

import { createElement } from "react";
import { NextFunction, Request, Response } from "express";
import { renderToPipeableStream, renderToString } from "react-dom/server";

import { formatClassName } from "../utils/text";
import { getAppComponent } from "../clientSSR/generator";
import { isPromise } from "util/types";
import type { Stats } from "webpack";

export function clientSPAHandler(
  props: RumboRegisterClientSPAProps,
  stats?: Stats
) {
  const {
    app,
    debug = false,
    route,
    publicPath = "",
    rootDir,
    pwaEnabled = false,
    clientUseRouter,
    distDir,
  } = props;

  const { default: AppComponent } = getAppComponent({
    publicPath,
    route,
    debug,
    rootDir,
    pwaEnabled,
  });

  let getServerProps: any = null;
  try {
    const meta = require(path.join(props.location, "_routeMeta"));
    getServerProps = meta.getServerProps;
  } catch (err) {}

  var statsJson = stats?.toJson();

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
            ?.filter((item) => item.name.endsWith(".css"))
            .map((item) => `/static/${item.name}`),
        },
        globalData,
        serverData,
      });

      renderToString(AppContainer);

      const { pipe } = renderToPipeableStream(AppContainer, {
        bootstrapScripts: statsJson?.assets
          ?.filter((item) => item.name.endsWith(".js"))
          .map((item) => `/static/${item.name}`),
        onShellReady() {
          res.setHeader("content-type", "text/html");
        },
        onAllReady() {
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
