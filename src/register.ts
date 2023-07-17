import express, { Express } from "express";

import registerClient from "./client";
import registerServerHandlers from "./server";
import path from "path";

export default async function registerHandlers(options: {
  app: Express;
  debug?: boolean;
  publicPath?: string;
  server?:
    | boolean
    | {
        route: string;
        dirPath: string;
      };
  react:
    | boolean
    | {
        route: string;
        dirPath: string;
      };
}) {
  process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
  console.clear();
  console.log("Start...");

  const {
    app,
    server = true,
    react,
    debug = false,
  } = options;

  let rootPath = require.main?.path || "src";
  const publicPath = options.publicPath || path.join(rootPath, "/app/public");

  if (react) {
    let reactConfigs =
      typeof react === "object"
        ? react
        : { dirPath: `${rootPath}/app/client`, route: "/" };
    await registerClient({ app, debug, ...reactConfigs, publicPath });
  }

  if (server) {
    let serverConfigs =
      typeof react === "object"
        ? react
        : { dirPath: `${rootPath}/app/server`, route: "/api" };
    await registerServerHandlers({ app, debug, ...serverConfigs });
  }

  app.use("/", express.static(publicPath));
}
