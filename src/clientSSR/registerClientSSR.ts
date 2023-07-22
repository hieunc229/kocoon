import "ignore-styles";
import fs from "fs";
import path from "path";
import chalk from "chalk";

import { Express } from "express";
import { createElement } from "react";
import { createStaticHandler } from "react-router-dom/server";

import { clientHandler } from "./handler";
import { bundleClientSSR } from "./bundler";

import {
  ClientRouteProps,
  PathProps,
  getRegisterPath,
  sortPath,
} from "./utils";
import { getAppComponent } from "./generator";

type Props = {
  location: string;
  publicPath: string;
  rootDir: string;
  distDir: string;
  route: string;
  app: Express;
  debug?: boolean;
};

const layoutRegex = /_layout$/i;

export default async function registerClientSSR(props: Props) {
  const {
    app,
    publicPath,
    debug = false,
    distDir,
    route,
    rootDir,
    location,
  } = props;

  let paths: PathProps[] = [];
  debug && console.log(chalk.green(`[Client SSR]`, route));

  async function registerPath(ppath: string, _path: string) {
    for (let p of fs.readdirSync(_path)) {
      const filePath = path.join(_path, p);
      const currentRoutePath = path.join(route, ppath, p);

      if (fs.statSync(filePath).isDirectory()) {
        await registerPath(currentRoutePath, filePath);
        continue;
      }

      if (filePath.match(/\.(js|ts|tsx|jsx)$/)) {
        paths.push(
          getRegisterPath({
            filePath,
            routePath: currentRoutePath,
          })
        );
      }
    }
  }

  await registerPath("", location);

  paths = paths.sort(sortPath);

  let routes: {
    [path: string]: ClientRouteProps;
  } = {};

  for (let p of paths) {
    const pFilePath = p.filePath;
    const pHandlePath = p.handlePath;

    if (pHandlePath === "/_context") {
      continue;
    }

    const handler = require(pFilePath);
    const isLayout = layoutRegex.test(pHandlePath);
    let data = {};

    let rname = pHandlePath;

    if (isLayout) {
      rname = pHandlePath.replace(layoutRegex, "");
      data = {
        layout: handler,
        layoutName: p.handlePath.replace(/(\/|:)/g, "_"),
        layoutPath: p.filePath.replace(/\.(js|ts|tsx)$/g, ""),
      };
    } else {
      data = {
        handler,
        handlerName: p.handlePath.replace(/(\/|:)/g, "_"),
        handlerPath: p.filePath.replace(/\.(js|ts|tsx)$/g, ""),
      };
    }

    routes[rname] = Object.assign({}, routes[rname], data);
  }

  const staticRoutes = Object.entries(routes).map(
    ([route, { layout, handler }]): any => {
      if (layout) {
        return {
          path: route,
          element: createElement(
            layout.default,
            null,
            createElement(handler.default)
          ),
        };
      }
      return {
        path: route,
        Component: handler.default,
      };
    }
  );

  const staticHandler = createStaticHandler(staticRoutes);
  const AppComponent = await getAppComponent({ rootDir, publicPath });

  // register paths
  Object.entries(routes).forEach(([r, props]) => {
    app.get(
      r,
      clientHandler(props, {
        staticRoutes,
        staticHandler,
        AppComponent,
        route: r,
      })
    );
    debug && console.log(chalk.gray(`-`, r));
  });

  await bundleClientSSR({ entries: paths, publicPath, routes, route, distDir });
}
