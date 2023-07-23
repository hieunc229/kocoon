import { HandlerProps } from "./handler";
import { Request as ExpressRequest } from "express";

export type ClientRouteProps = {
  handler: HandlerProps;
  handlerName: string;
  handlerPath: string;
  layout?: HandlerProps;
  layoutName?: string;
  layoutPath?: string;
};

export type ClientRoutes = { [path: string]: ClientRouteProps };

export type PathProps = {
  handlePath: string;
  filePath: string;
};

export function sortPath(a: PathProps, b: PathProps) {
  return a.handlePath.localeCompare(b.handlePath);
}

export function getRegisterPath(options: {
  filePath: string;
  routePath: string;
}) {
  const { filePath, routePath } = options;
  let [name = ""] = routePath.split(".");
  const handlePath = name.replace("index", "").replace(/\[([a-z]+)\]/gi, ":$1");

  return {
    handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
    filePath,
  };
}

export function createFetchRequest(req: ExpressRequest) {
  let origin = `${req.protocol}://${req.get("host")}`;
  let url = new URL(req.originalUrl || req.url, origin);

  let controller = new AbortController();
  req.on("close", () => controller.abort());

  let headers = new Headers();

  for (let [key, values] of Object.entries(req.headers)) {
    if (values) {
      if (Array.isArray(values)) {
        for (let value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  let init: any = {
    method: req.method,
    headers,
    signal: controller.signal,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
  }

  return new Request(url.href, init);
}

export function isPromise(p: any) {
  if (typeof p === "object" && typeof p.then === "function") {
    return true;
  }

  return false;
}
