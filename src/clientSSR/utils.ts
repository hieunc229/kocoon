import { Request as ExpressRequest, Response } from "express";
import { URL } from "url";

import { Readable } from "node:stream"
import { StreamPump } from "./stream";

const fetch = require("node-fetch")

export function createFetchRequest(req: ExpressRequest, res: Response) {
  // req.hostname doesn't include port information so grab that from
 // `X-Forwarded-Host` or `Host`
 let [, hostnamePort] = req.get("X-Forwarded-Host")?.split(":") ?? [];
 let [, hostPort] = req.get("host")?.split(":") ?? [];
 let port = hostnamePort || hostPort;
 // Use req.hostname here as it respects the "trust proxy" setting
 let resolvedHost = `${req.hostname}${port ? `:${port}` : ""}`;
 let url = new URL(`${req.protocol}://${resolvedHost}${req.url}`);

 // Abort action/loaders once we can no longer write a response
 let controller = new AbortController();
 res.on("close", () => controller.abort());

 let init: RequestInit = {
   method: req.method,
   headers: req.headers as any,
   signal: controller.signal,
 };

 if (req.method !== "GET" && req.method !== "HEAD") {
   init.body = createReadableStreamFromReadable(req);
   (init as { duplex: "half" }).duplex = "half";
 }

 
 return new fetch.Request(url.href, init);
}

export const createReadableStreamFromReadable = (
  source: Readable & { readableHighWaterMark?: number }
) => {
  let pump = new StreamPump(source);
  let stream = new ReadableStream(pump, pump);
  return stream;
};


// export function createFetchRequest(req: ExpressRequest) {
//   let origin = `${req.protocol}://${req.get("host")}`;
//   let url = new URL(req.originalUrl || req.url, origin);

//   let controller = new AbortController();
//   req.on("close", () => controller.abort());

//   let headers: any = {};

//   for (let [key, values] of Object.entries(req.headers)) {
//     if (values) {
//       if (Array.isArray(values)) {
//         for (let value of values) {
//           headers[key] = value;
//         }
//       } else {
//         headers[key] = values;
//       }
//     }
//   }

//   let init: any = {
//     method: req.method,
//     headers,
//     signal: controller.signal,
//   };

//   if (req.method !== "GET" && req.method !== "HEAD") {
//     init.body = req.body;
//   }

//   return new Request(url.href, init);
// }

export function isPromise(p: any) {
  if (typeof p === "object" && typeof p.then === "function") {
    return true;
  }

  return false;
}
