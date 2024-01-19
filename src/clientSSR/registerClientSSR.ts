import chalk from "chalk";

import bundleClientSSR from "./bundler";
import createClientSSRRequest from "./handler";

import { Express } from "express";
import { createElement } from "react";
import { RouteObject } from "react-router-dom";
import { createStaticHandler } from "react-router-dom/server";

import { getAppComponent } from "./generator";

import {
  excludeRegex,
  getLayoutRoute,
  importPathsToClientRoutes,
  resolveImports,
} from "../utils/route";

type Props = {
  location: string;
  publicPath: string;
  rootDir: string;
  distDir: string;
  route: string;
  app: Express;
  appProps: RumboProps,
  debug?: boolean;
  clientUseRouter?: boolean;
  excludePaths?: string[]
  staticImports: null | {
    [subRoute: string]: RumboStaticRoute;
  };
};

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
    excludePaths = [],
    appProps
  } = props;

  debug && console.log(chalk.green(`[Client SSR]`, route));

  const paths: RumboStaticRoute[] = staticImports
    ? Object.entries(staticImports).map(([, item]) => item)
    : resolveImports({
        route,
        location,
        type: "client",
        excludePaths
      }).map((item) => {
        return {
          ...item,
          staticImport: require(item.filePath),
        };
      });

  const routes = importPathsToClientRoutes({ paths });
  const staticRoutes: RouteObject[] = Object.entries(routes)
    .filter((item) => !excludeRegex.test(item[0]))
    .map(([route, { handler }]): any => {
      const layoutHandler = getLayoutRoute(route, routes);
      if (layoutHandler?.layout) {
        return {
          path: route,
          element: createElement(
            layoutHandler.layout.default,
            handler.layoutProps,
            createElement(handler.default)
          ),
        };
      }
      return {
        path: route,
        Component: handler.default,
      };
    });

  const staticHandler = createStaticHandler(staticRoutes) as any;
  const AppComponent = (
    staticImports
      ? staticImports.__rumboClientSSR.staticImport
      : getAppComponent({ publicPath, route, debug, rootDir })
  ).default;


  if (!staticImports) {
    debug && console.log(chalk.gray("Bundle client..."));
    await bundleClientSSR({
      entries: paths,
      publicPath,
      routes,
      route,
      distDir,
      debug,
      rootDir,
      app,
      appProps
    });
  }

  // register paths
  Object.entries(routes).forEach(([r, props]) => {
    let parts = r.split("/");
    const name = parts.pop();
    if (name === "_middleware") {
      app.use(parts.join("/"), props.handler.default);
      return;
    }

    if (name && name[0] === `_`) {
      return;
    }

    app.get(
      r,
      createClientSSRRequest(props, {
        staticRoutes,
        staticHandler,
        AppComponent,
        route,
        clientUseRouter,
        routes,
      })
    );
    debug && console.log(chalk.gray(`-`, r));
  });
}
