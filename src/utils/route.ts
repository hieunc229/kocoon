import fs from "fs";
import path from "path";
import { formatClassName } from "./text";

export function resolveImports<T = ResolveImportProps>(options: {
  route: string;
  location: string;
  type: "server" | "client";
  excludePaths: string[];
}): T[] {
  const { route, location, type, excludePaths = [] } = options;

  let paths: T[] = [];

  const pathTransform =
    type === "server" ? getRegisterServerPath : getRegisterClientPath;
  const partSort = type === "server" ? sortServerPath : sortClientPath;

  function registerPath(pathRoute: string, _path: string) {
    for (let p of fs.readdirSync(_path)) {
      const fileAbsPath = path.join(_path, p);
      const filePath = path.join(route, pathRoute.replace(route, ""), p);

      if (fs.statSync(fileAbsPath).isDirectory()) {
        if (!excludePaths.includes(p)) {
          registerPath(filePath, fileAbsPath);
        }
        continue;
      }

      if (fileAbsPath.match(/\.(js|ts|tsx|jsx)$/)) {
        paths.push(
          pathTransform({
            filePath: fileAbsPath,
            routePath: filePath.replace("[..]", "*"),
          }) as any
        );
      }
    }
  }

  registerPath("", location);

  return paths.sort(partSort as any);
}

export function toStaticRoute<T = ResolveImportProps>(
  item: T
): RumboStaticRoute<T> {
  // @ts-ignore
  const staticImport = require(item.filePath);
  // @ts-ignore
  let handlePath = item.handlePath;

  // @ts-ignore
  let method = item.method;

  if (
    !["post", "get", "patch", "put", "delete", "options", "use"].includes(
      method
    )
  ) {
    handlePath += "/" + method;
    method = staticImport.props?.type || "get";
  }

  return {
    ...item,
    staticImport,
    handlePath,
    method,
  };
}

function sortClientPath(a: ResolveImportProps, b: ResolveImportProps) {
  if (a.handlePath.indexOf("*") !== -1 && b.handlePath.indexOf("*") == -1) {
    return 1;
  }

  return b.handlePath.length - a.handlePath.length;
}

// Define the order of HTTP methods based on priority
const httpMethodPriority = ["all", "get", "post", "put", "delete", "patch"];

function sortServerPath(
  a: ResolveImportServerProps,
  b: ResolveImportServerProps
) {
  // Compare HTTP methods based on their priority
  const methodA = httpMethodPriority.indexOf(a.method.toLowerCase());
  const methodB = httpMethodPriority.indexOf(b.method.toLowerCase());

  // Sort by method priority first
  if (methodA !== methodB) {
    return methodA - methodB;
  }

  const apathIndex = a.handlePath.lastIndexOf("/");
  const bpathIndex = b.handlePath.lastIndexOf("/");

  if (
    a.handlePath.substring(0, apathIndex) ===
    b.handlePath.substring(0, bpathIndex)
  ) {
    if (
      a.handlePath.substring(apathIndex).includes(":") &&
      !b.handlePath.substring(bpathIndex).includes(":")
    ) {
      return -1;
    }
    if (
      !a.handlePath.substring(apathIndex).includes(":") &&
      b.handlePath.substring(bpathIndex).includes(":")
    ) {
      return -1;
    }
  }

  // If methods are the same or both are 'all', compare paths
  return a.handlePath.localeCompare(b.handlePath);
}

function getRegisterClientPath(options: {
  filePath: string;
  routePath: string;
}): ResolveImportProps {
  const { filePath, routePath } = options;
  const name = routePath.substring(0, routePath.lastIndexOf("."))
  const handlePath = name.replace("index", "").replace(/\[([a-z]+)\]/gi, ":$1");

  return {
    handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
    filePath,
  };
}

function getRegisterServerPath(options: {
  filePath: string;
  routePath: string;
}): ResolveImportServerProps {
  const { filePath } = options;
  const routePath = options.routePath.substring(0, options.routePath.lastIndexOf("."))
  let parts = (routePath || "").split("/");
  let method = parts.pop();
  let name = parts.join("/");

  if (!method || method === "index") {
    method = "get";
  } else if (method === "_middleware") {
    method = "use";
  }

  if (
    ["use", "patch", "options", "get", "post", "delete"].indexOf(
      method.toLowerCase()
    ) === -1
  ) {
    name += `/${method}`;
    method = "get";
  }

  let handlePath =
    name.replace("index", "").replace(/\[([a-z]+)\]/gi, ":$1") || "/";

  return {
    handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
    method,
    filePath,
  };
}

export const layoutRegex = /_layout$/i;
export const excludeRegex = /_(layout|middleware|context|container)$/i;
export const excludeWithoutLayoutRegex = /_(context|container)$/i;
export function importPathsToClientRoutes(props: {
  paths: RumboStaticRoute[];
}) {
  let routes: {
    [path: string]: ClientRouteProps;
  } = {};

  for (let p of props.paths) {
    const pHandlePath = p.handlePath;

    if (!pHandlePath || excludeWithoutLayoutRegex.test(pHandlePath)) {
      continue;
    }

    const handler = p.staticImport;
    const isLayout = layoutRegex.test(pHandlePath);
    let data = {};

    let rname = pHandlePath.replace(/\*+/, "*");

    if (isLayout) {
      data = {
        layout: handler,
        layoutName: formatClassName(p.handlePath),
        layoutPath: p.filePath.replace(/\.(js|ts|tsx)$/g, ""),
      };
    } else {
      data = {
        handler,
        handlerName: formatClassName(p.handlePath),
        handlerPath: p.filePath.replace(/\.(js|ts|tsx)$/g, ""),
      };
    }

    routes[rname] = Object.assign({}, routes[rname], data);
  }

  return routes;
}

export function getLayoutRoute(
  path: string,
  routes: { [name: string]: ClientRouteProps }
) {
  return (
    routes[`${path}/_layout`] ||
    (path == "/"
      ? routes["/_layout"]
      : routes[path.replace(/\/[a-z:0-9_\:\*\-\_]+$/, "/_layout")])
  );
}
