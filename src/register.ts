import { Express } from "express";

import registerClient from "./client";
import registerServerHandlers from "./server";

export default async function registerHandlers(options: {
  app: Express,
  debug?: boolean,
  server: {
    route: string,
    dirPath: string
  },
  client: {
    route: string,
    dirPath: string
  },
}) {
  process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
  console.clear();
  console.log("Start...");

  const { app, server, client, debug = false } = options;
  await registerClient({ app, debug, ...client });
  await registerServerHandlers({ app, debug,  ...server });
}
