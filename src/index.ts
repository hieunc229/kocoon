import path from "path";
import chalk from "chalk";
import fse from "fs-extra";
import express from "express";

import registerServer from "./server/registerServer";
import registerClientSSR from "./clientSSR/registerClientSSR";
import registerClientSPA from "./clientSPA/registerClientSPA";

import { Express } from "express";
import { staticMiddleware } from "./utils/handlers";

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
    staticExtensions
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

  for (const client of apps) {
    const staticImports: any = staticRoutes ? staticRoutes[client.route] : null;
    switch (client.type) {
      case "server":
        await registerServer({
          app,
          debug,
          staticImports,
          ...client,
          excludePaths: client.excludePaths || [],
        });
        break;
      case "client-spa":
        await registerClientSPA({
          app,
          debug,
          publicPath,
          distDir,
          staticImports,
          rootDir,
          ...client,
          excludePaths: client.excludePaths || [],
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
          excludePaths: client.excludePaths || [],
          appProps: options
        });
        break;
      case "static":
        app.use(client.route, express.static(client.location));
        break;
    }
  }

  app.get("/*", staticMiddleware({ location: distDir, extensions: staticExtensions }));

  if (listen) {
    let { host, port } = Object.assign(
      { host: "0.0.0.0", port: 3000 },
      typeof listen === "object" ? listen : {}
    );

    app.listen(port, host, () => {
      console.log(chalk.green(`Server available on ${host}:${port}`));
    });
  }
}
