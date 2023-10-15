import path from "path";
import { NextFunction, Request, Response } from "express";

const exts =
  "ai,xlx,doc,docx,avi,css,csv,doc,docx,eot,gif,ico,icon,jpeg,jpg,js,json,mov,mp3,mp4,otf,pdf,png,svg,ttf,txt,wav,woff,wasm,woff2";
  
export function staticMiddleware(props: {
  location: string;
  extensions?: string;
}) {
  const { location, extensions = "" } = props;

  const allowedExts = `${exts},${extensions}`.split(",").filter(Boolean);

  return function (req: Request, res: Response, next: NextFunction) {
    const parts = req.path.split(".");
    const ext = parts.pop();

    // // rewrite index
    // if (req.path.match(/index.html$/)) {
    //   return res.sendFile(path.join(location, "index.html"));
    // }

    if (parts.length && ext && allowedExts.indexOf(ext) !== -1) {
      return res.sendFile(path.join(location, req.path));
    }
    next();
  };
}
