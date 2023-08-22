import chalk from "chalk";

import { Express } from "express";
import { resolveImports, toStaticRoute } from "../utils/route";

type PathProps = {
  handlePath: string;
  method: string;
  filePath: string;
};

export default async function registerServer(options: {
  app: Express;
  debug?: boolean;
  route: string;
  location: string;
  staticImports: null | {
    [subRoute: string]: RumboStaticRoute<ResolveImportServerProps>;
  };
}) {
  const { app, location, route, debug = false, staticImports } = options;

  debug && console.log(chalk.green(`[Server]`, route));

  // let paths: PathProps[] = [];
  // async function registerPath(ppath: string, _path: string) {
  //   for (let p of fs.readdirSync(_path)) {
  //     const filePath = path.join(_path, p);
  //     const currentRoutePath = path.join(route, ppath, p);

  //     if (fs.statSync(filePath).isDirectory()) {
  //       await registerPath(path.join(ppath, p), filePath);
  //       continue;
  //     }

  //     paths.push(
  //       getRegisterPath({
  //         filePath,
  //         routePath: currentRoutePath,
  //       })
  //     );
  //   }
  // }

  // await registerPath("", location);

  const paths = staticImports
    ? Object.entries(staticImports).map(([, item]) => item)
    : resolveImports<ResolveImportServerProps>({
        route,
        location,
        type: "server",
      }).map(toStaticRoute);

  paths.forEach((p, i, list) => {
    let found = list.findIndex((li) => li.handlePath === p.handlePath);
    if (found !== i && list[found]?.method === p.method) {
      console.log(
        chalk.red.bold(`Error: Ambiguous path (${p.handlePath})`),
        `\n- ${p.filePath}\n- ${list[found]?.filePath}`
      );
      process.exit(1);
    }
  });

  for (let p of paths) {
    const pMethod = p.method;
    const pFilePath = p.filePath;
    const pHandlePath = p.handlePath;

    // debug &&
    //   console.log(
    //     `staticImports server ${formatClassName(pHandlePath)} (${pFilePath})`
    //   );
    const handlers = p.staticImport;
    // (staticImports && staticImports[formatClassName(pHandlePath)]?.import) ||
    // require(pFilePath);

    if (typeof handlers.default === "function") {
      app[
        pMethod as "post" | "get" | "patch" | "delete" | "use" | "options"
      ].apply(
        app,
        // @ts-ignore
        [pHandlePath, Object.keys(handlers).map((k) => handlers[k])]
      );

      debug &&
        console.log(chalk.gray(`- (${pMethod})`, pHandlePath, pFilePath));
    } else {
      console.log(
        chalk.redBright(
          `Invalid handler:\n- (${pMethod}) ${pHandlePath}\n- at ${pFilePath}`
        )
      );
      process.exit();
    }
  }

  console.log(chalk.gray(`- Server routes initiated`));
}

function sortPath(a: PathProps, b: PathProps) {
  if (a.handlePath === b.handlePath && a.method === "use") {
    return -1;
  }
  return a.handlePath.localeCompare(b.handlePath);
}

function transformPath(options: ResolveImportProps) {
  const { filePath, handlePath: routePath } = options;
  let parts = (routePath.split(".").shift() || "").split("/");
  let method = parts.pop();
  const name = parts.join("/");

  if (!method || method === "index") {
    method = "get";
  } else if (method === "_middleware") {
    method = "use";
  }

  const handlePath =
    name.replace("index", "").replace(/\[([a-z]+)\]/gi, ":$1") || "/";

  return {
    handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
    method,
    filePath,
  };
}

// function getRegisterPath(options: { filePath: string; routePath: string }) {
//   const { filePath, routePath } = options;
//   let parts = (routePath.split(".").shift() || "").split("/");
//   let method = parts.pop();
//   const name = parts.join("/");

//   if (!method || method === "index") {
//     method = "get";
//   } else if (method === "_middleware") {
//     method = "use";
//   }

//   const handlePath =
//     name.replace("index", "").replace(/\[([a-z]+)\]/gi, ":$1") || "/";

//   return {
//     handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
//     method,
//     filePath,
//   };
// }
