import "ignore-styles";
import chalk from "chalk";

import { Express } from "express";
import { createElement } from "react";
import { RouteObject } from "react-router-dom";
import { createStaticHandler } from "react-router-dom/server";

import { clientHandler } from "./handler";
import { bundleClientSSR } from "./bundler";

import { ClientRouteProps } from "./utils";
import { getAppComponent } from "./generator";
import { formatClassName } from "../utils/text";
import { RumboStaticRoute, resolveImports } from "../utils/route";

type Props = {
  location: string;
  publicPath: string;
  rootDir: string;
  distDir: string;
  route: string;
  app: Express;
  debug?: boolean;
  clientUseRouter?: boolean;
  staticImports: null | {
    [subRoute: string]: RumboStaticRoute;
  };
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
    clientUseRouter = false,
    staticImports,
  } = props;

  debug && console.log(chalk.green(`[Client SSR]`, route));

  const paths: RumboStaticRoute[] = staticImports
    ? Object.entries(staticImports).map(([, item]) => item)
    : resolveImports({
        route,
        location,
        type: "client",
      }).map((item) => ({
        ...item,
        staticImport: require(item.filePath),
      }));

  let routes: {
    [path: string]: ClientRouteProps;
  } = {};

  for (let p of paths) {
    const pHandlePath = p.handlePath;

    if (!pHandlePath || pHandlePath === "/_context") {
      continue;
    }

    // debug &&
    //   console.log(
    //     `staticImports ssr ${formatClassName(pHandlePath)} (${pFilePath})`
    //   );
    const handler = p.staticImport;
    // (staticImports && staticImports[formatClassName(pHandlePath)]?.import) ||
    // require(pFilePath);
    const isLayout = layoutRegex.test(pHandlePath);
    let data = {};

    let rname = pHandlePath;

    if (isLayout) {
      rname = pHandlePath.replace(layoutRegex, "");
      data = {
        layout: handler,
        layoutName: formatClassName(p.handlePath),
        layoutPath: p.filePath.replace(/\.(js|ts|tsx)$/g, ""),
      };
    } else {
      data = {
        handler,
        handlerName: formatClassName(p.handlePath),
        handlerPath: p.filePath.replace(/\.(js|ts|tsx)$/g, ""),
      };
    }

    routes[rname] = Object.assign({}, routes[rname], data);
  }

  const staticRoutes: RouteObject[] = Object.entries(routes).map(
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
  const AppComponent = (
    staticImports
      ? staticImports.__rumboClientSSR.staticImport
      : getAppComponent({ rootDir, publicPath, route, debug })
  ).default;

  // register paths
  Object.entries(routes).forEach(([r, props]) => {
    app.get(
      r,
      clientHandler(props, {
        staticRoutes,
        staticHandler,
        AppComponent,
        route: r,
        clientUseRouter,
      })
    );
    debug && console.log(chalk.gray(`-`, r));
  });

  if (!staticImports) {
    debug && console.log(chalk.gray("Bundle client..."));
    await bundleClientSSR({
      entries: paths,
      publicPath,
      routes,
      route,
      distDir,
      debug,
    });
  }
}
