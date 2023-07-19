import fs from "fs";
import path from "path";
import chalk from "chalk";

import { Express } from "express";
import { createElement } from "react";
import { createStaticHandler } from "react-router-dom/server";

import { bundleReactClient } from "./bundle";
import { HandlerProps, clientHandler } from "./handler";
import { bundleReactSPAClient } from "./bundleSPA";

export type PathProps = {
  handlePath: string;
  filePath: string;
};

export type ReactSettings = {
  route: string;
  /**
   * Use as single page app
   */
  spa?: boolean;
  dirPath: string;
};

const layoutRegex = /_layout$/i;

export default async function registerReactClient(options: {
  app: Express;
  debug?: boolean;
  publicPath?: string;
  settings: ReactSettings;
}) {
  const { route, spa, dirPath } = options.settings;
  const { app, publicPath, debug = false } = options;

  if (spa) {
    await bundleReactSPAClient({ publicPath, dirPath });
    app.use(`${route}`, function (req, res) {
      res.sendFile(path.join(publicPath || "./public", "index.html"));
    });
    return;
  }

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

  await bundleReactClient({ entries: paths, publicPath, routes });
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
