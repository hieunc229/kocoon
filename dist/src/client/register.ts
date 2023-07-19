import fs from "fs";
import path from "path";
import chalk from "chalk";

import { Express } from "express";
import { createElement } from "react";
import { createStaticHandler } from "react-router-dom/server";

import { bundleClient } from "./bundle";
import { HandlerProps, clientHandler } from "./handler";

export type PathProps = {
  handlePath: string;
  filePath: string;
};

const layoutRegex = /_layout$/i;

export default async function registerClient(options: {
  app: Express;
  debug?: boolean;
  route: string;
  dirPath: string;
  publicPath?: string;
}) {
  const { app, dirPath, route, publicPath, debug = false } = options;

  let paths: PathProps[] = [];

  async function registerPath(ppath: string, _path: string) {
    for (let p of fs.readdirSync(_path)) {
      const filePath = path.join(_path, p);
      const currentRoutePath = path.join(route, ppath, p);

      if (fs.statSync(filePath).isDirectory()) {
        await registerPath(currentRoutePath, filePath);
        continue;
      }

      paths.push(
        getRegisterPath({
          filePath,
          routePath: currentRoutePath,
        })
      );
    }
  }

  await registerPath("", dirPath);

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

    debug && console.log(chalk.gray("Register", pFilePath));

    const handler = await import(pFilePath);
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

  let staticRoutes = Object.entries(routes).map(
    ([path, { layout, handler }]): any => {
      if (layout) {
        return {
          path,
          element: createElement(
            layout.default,
            null,
            createElement(handler.default)
          ),
        };
      }
      return {
        path,
        Component: handler.default,
      };
    }
  );

  let staticHandler = createStaticHandler(staticRoutes);

  // register paths
  Object.entries(routes).forEach(([path, props]) => {
    app.get(path, clientHandler(props, { staticRoutes, staticHandler }));

    debug && console.log(chalk.green(`[Client]`, path));
  });

  await bundleClient({ entries: paths, publicPath, routes });
}

export type ClientRouteProps = {
  handler: HandlerProps;
  handlerName: string;
  handlerPath: string;
  layout?: HandlerProps;
  layoutName?: string;
  layoutPath?: string;
};

export type ClientRoutes = { [path: string]: ClientRouteProps };

function sortPath(a: PathProps, b: PathProps) {
  return a.handlePath.localeCompare(b.handlePath);
}

function getRegisterPath(options: { filePath: string; routePath: string }) {
  const { filePath, routePath } = options;
  let [name] = routePath.split(".");
  const handlePath = name.replace("index", "").replace(/\[([a-z]+)\]/gi, ":$1");

  return {
    handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
    filePath,
  };
}
