import path from "path";
import chalk from "chalk";
import fse from "fs-extra";
import express from "express";

import registerServer from "./server/registerServer";
import registerClientSSR from "./clientSSR/registerClientSSR";
import registerClientSPA from "./clientSPA/registerClientSPA";

import { Express } from "express";
import { formatClassName } from "./utils/text";
import { staticMiddleware } from "./utils/handlers";
import { ResolveImportServerProps, RumboStaticRoute } from "./utils/route";

export type RumboAppType = "server" | "client-ssr" | "client-spa" | "static";

export type RumboAppProps = {
  location: string;
  type: RumboAppType;

  /**
   * Enable React Router (react-router-dom)
   * If your app is client-ssr, and already have router, set to `false`
   */
  clientUseRouter?: boolean;
};

export type RumboAppConfigs = RumboAppProps & {
  route: string;
};

export type RumboRouteProps ={ [route: string]: RumboAppProps }
export type RumboProps = {
  debug?: boolean;
  publicDir?: string;
  distDir?: string;
  rootDir?: string;
  routes: RumboRouteProps;
  staticRoutes: null | {
    [route: string]: { [subRoute: string]: RumboStaticRoute };
  };
  listen?:
    | boolean
    | {
        host?: string;
        port?: number;
      };
};

export default async function Rumbo(app: Express, options: RumboProps) {
  process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
  console.clear();
  console.log(chalk.gray("Rumbo is starting..."));

  const {
    rootDir = __dirname || "src",
    debug = false,
    publicDir,
    listen,
    routes,
    staticRoutes,
  } = options;

  const publicPath = publicDir || path.join(rootDir, "../public");
  const distDir = options.distDir || path.join(rootDir, "../dist");

  const apps = Object.entries(routes)
    .map(
      ([route, props]) =>
        ({
          ...props,
          route,
        } as RumboAppConfigs)
    )
    .sort((a, b) => b.route.length - a.route.length);

  if (distDir !== publicPath) {
    fse.copySync(publicPath, distDir);
  }

  app.get("/*", staticMiddleware({ location: distDir }));

  for (const client of apps) {
    const staticImports: any = staticRoutes
      ? staticRoutes[client.route]
      : null;
    switch (client.type) {
      case "server":
        await registerServer({
          app,
          debug,
          staticImports,
          ...client,
        });
        break;
      case "client-spa":
        await registerClientSPA({
          app,
          debug,
          publicPath,
          distDir,
          staticImports,
          ...client,
        });
        break;
      case "client-ssr":
        await registerClientSSR({
          app,
          debug,
          publicPath,
          distDir,
          rootDir,
          staticImports,
          ...client,
        });
        break;
      case "static":
        app.use(client.route, express.static(client.location));
        break;
    }
  }

  let { host, port } = Object.assign(
    { host: "localhost", port: 3000 },
    typeof listen === "object" ? listen : {}
  );

  app.listen(port, host, () => {
    console.log(chalk.green(`Server available on ${host}:${port}`));
  });
}
