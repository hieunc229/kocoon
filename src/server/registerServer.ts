import chalk from "chalk";

import { Express } from "express";
import { resolveImports, toStaticRoute } from "../utils/route";

// type PathProps = {
//   handlePath: string;
//   method: string;
//   filePath: string;
// };

export default async function registerServer(options: {
  app: Express;
  debug?: boolean;
  route: string;
  location: string;
  excludePaths?: string[];
  staticImports: null | {
    [subRoute: string]: RumboStaticRoute<ResolveImportServerProps>;
  };
}) {
  const {
    app,
    location,
    route,
    debug = false,
    staticImports,
    excludePaths = [],
  } = options;

  // debug && console.log(chalk.green(`[Server]`, route));

  const paths = staticImports
    ? Object.entries(staticImports).map(([, item]) => item)
    : resolveImports<ResolveImportServerProps>({
        route,
        location,
        type: "server",
        excludePaths,
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
    const handlers = p.staticImport;
    const pMethod = handlers.props?.type || p.method;
    const pFilePath = p.filePath;
    const pHandlePath = p.handlePath;

    if (typeof handlers.default === "function") {
      let classHandlers = Object.keys(handlers)
        .filter((k) => typeof handlers[k] === "function" && k !== "default")
        .sort((a, b) => (a === "default" ? -1 : b === "default" ? 1 : 1))
        .map((k) => handlers[k]);

      app[
        pMethod as "post" | "get" | "patch" | "delete" | "use" | "options"
      ].apply(
        app,
        // @ts-ignore
        [pHandlePath, [handlers.default, ...classHandlers]]
      );

      // debug &&
      //   console.log(
      //     chalk.gray(
      //       `- [${pMethod.substring(0,3).toUpperCase()}]`,
      //       pHandlePath,
      //       // pFilePath,
      //       classHandlers.length ? `(${classHandlers.length} extra handlers)` : ""
      //     )
      //   );
    } else {
      console.log(
        chalk.redBright(
          `✖ (${pMethod}) ${pHandlePath} (no default handler) ${pFilePath}`
        )
      );
      // process.exit();
    }
  }

  console.log(chalk.gray(`✓`, route));
}

// function sortPath(a: PathProps, b: PathProps) {
//   if (a.handlePath === b.handlePath && a.method === "use") {
//     return -1;
//   }
//   return a.handlePath.localeCompare(b.handlePath);
// }

// function transformPath(options: ResolveImportProps) {
//   const { filePath, handlePath: routePath } = options;
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
