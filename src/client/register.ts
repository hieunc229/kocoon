import fs from "fs";
import path from "path";

import express, { Express } from "express";
import { clientHandler } from "./handler";
import { bundleClient } from "./bundle";

export type PathProps = {
  handlePath: string,
  filePath: string
}

export default async function registerClient(options: {
  app: Express,
  debug?: boolean,
  route: string,
  dirPath: string
}) {

  const { app, dirPath, route, debug = false } = options;

  let paths: PathProps[] = [];

  async function registerPath(ppath: string, _path: string) {

    for (let p of fs.readdirSync(_path)) {
      const filePath = path.join(_path, p);
      const currentRoutePath = path.join(route, ppath, p);

      if (fs.statSync(filePath).isDirectory()) {
        await registerPath(currentRoutePath, filePath)
        continue;
      }

      paths.push(getRegisterPath({
        filePath,
        routePath: currentRoutePath
      }))
    }
  }

  await registerPath("", dirPath);

  paths = paths.sort(sortPath);
  app.use("/", express.static("./out/public"))

  for (let p of paths) {

    const pFilePath = p.filePath;
    const pHandlePath = p.handlePath;

    if (pHandlePath === "/_context") {
      continue;
    }

    const handlers = (await import(pFilePath));
    app.get(pHandlePath, clientHandler(handlers))

    debug && console.log(`[Client]`, pHandlePath, pFilePath)
  }

  await bundleClient({ entries: paths })
}

function sortPath(a: PathProps, b: PathProps) {
  return a.handlePath.localeCompare(b.handlePath);
}

function getRegisterPath(options: { filePath: string, routePath: string }) {
  const { filePath, routePath } = options;
  let [name] = routePath.split(".");
  const handlePath = name
    .replace("index", "")
    .replace(/\[([a-z]+)\]/ig, ":$1");

  return {
    handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
    filePath
  }
}