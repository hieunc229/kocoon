import express, { Express } from "express";

import registerReactClient from "./client";
import registerServerHandlers from "./server";
import path from "path";
import { ReactSettings } from "./client/register";

type ServerSettings = {
  route: string;
  dirPath: string;
};

export default async function registerHandlers(options: {
  app: Express;
  debug?: boolean;
  publicPath?: string;
  server?: boolean | ServerSettings;
  react?: boolean | ReactSettings;
}) {
  process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
  console.clear();
  console.log("Start...");

  const { app, server = true, react, debug = false } = options;

  let rootPath = require.main?.path || "src";
  const publicPath = options.publicPath || path.join(rootPath, "/app/public");

  if (react) {
    let reactConfigs =
      typeof react === "object"
        ? react
        : { spa: false, dirPath: `${rootPath}/app/client`, route: "/" };
    await registerReactClient({
      app,
      debug,
      settings: reactConfigs,
      publicPath,
    });
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
