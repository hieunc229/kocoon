import fs from "fs";
import path from "path";
import chalk from "chalk";

import { Express } from "express";

type PathProps = {
  handlePath: string,
  method: string,
  filePath: string
}

export default async function registerServerHandlers(options: {
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
        await registerPath(path.join(ppath, p), filePath)
        continue;
      }

      paths.push(getRegisterPath({
        filePath,
        routePath: currentRoutePath
      }))
    }
  }

  await registerPath("", dirPath);

  paths = paths.sort(sortPath)

  paths.forEach((p, i, list) => {
    let found = list.findIndex(li => li.handlePath === p.handlePath)
    if (found !== i && list[found].method === p.method) {
      console.log(
        chalk.red.bold(`Error: Ambiguous path (${p.handlePath})`),
        `\n- ${p.filePath}\n- ${list[found].filePath}`
      );
      process.exit(1);
    }
  })

  for (let p of paths) {
    const pMethod = p.method;
    const pFilePath = p.filePath;
    const pHandlePath = p.handlePath;

    const handlers = (await import(pFilePath));


    app[pMethod as "post" | "get" | "patch" | "delete" | "use" | "options"]
      .apply(
        app,
        // @ts-ignore
        [pHandlePath, Object.keys(handlers).map(k => handlers[k])])

    debug && console.log(`[${(pMethod.toUpperCase() + "  ").substring(0, 5)}]`, pHandlePath, pFilePath)
  }
}

function sortPath(a: PathProps, b: PathProps) {

  if (a.handlePath === b.handlePath) {
    return a.method === "use" ? 1 : -1;
  }
  return a.handlePath.localeCompare(b.handlePath);
}

function getRegisterPath(options: { filePath: string, routePath: string }) {

  const { filePath, routePath } = options;
  let [name, ...paths] = routePath.split(".");
  let method = paths.length === 1 ? "get" : paths[0].toLowerCase();

  let nameSplits = name.split("/");
  if (nameSplits.pop() === "_middleware") {
    method = "use";
    name = nameSplits.join("/")
  }

  const handlePath = name
    .replace("index", "")
    .replace(/\[([a-z]+)\]/ig, ":$1");

  return {
    handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
    method,
    filePath
  }
}