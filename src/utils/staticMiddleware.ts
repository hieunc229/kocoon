import fs from "fs";
import path from "path";
import { NextFunction, Request, Response } from "express";

export function staticMiddleware(props: {
  location: string;
  extensions?: string;
  headers?: any;
}) {
  const { location } = props;
  return function (req: Request, res: Response, next: NextFunction) {
    if (req.originalUrl.includes(".")) {
      const filePath = path.join(
        location,
        (req.params?.path as string) || req.originalUrl
      );
      if (fs.existsSync(filePath)) {
        res.setHeader("Cache-Control", "max-age=31536000");
        return res.sendFile(filePath);
      }
    }
    next();
  };
}
