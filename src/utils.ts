import path from "path";
import { NextFunction, Request, Response } from "express";

export function formatClassName(name: string) {
  return name.replace(/(\/|:)/g, "_").replace(/\*/g, "_any_");
}

export function staticMiddleware(props: {
  location: string;
  extensions?: string;
}) {
  const {
    location,
    extensions = "ai,xlx,doc,docx,avi,css,csv,doc,docx,eot,gif,ico,icon,jpeg,jpg,js,json,mov,mp3,mp4,otf,pdf,png,svg,ttf,txt,wav,woff",
  } = props;

  let allowedExts = extensions.split(",");

  return function (req: Request, res: Response, next: NextFunction) {
    const parts = req.path.split(".");
    const ext = parts.pop();
    if (parts.length && ext && allowedExts.indexOf(ext) !== -1) {
      return res.sendFile(path.join(location, req.path));
    }
    next();
  };
}
