import path from "path";
import bundleClientSPA from "./bundler";

import { Express, Request, Response } from "express";

type Props = RumboBundleClientSPAProps & {
  app: Express;
  excludePaths: string[]
};

export default async function registerClientSPA(props: Props): Promise<any> {
  const { app, distDir, route } = props;

  app.get(`${route}*`, function (_: Request, res: Response) {
    res.sendFile(path.join(distDir, route, "index.html"));
  });

  return bundleClientSPA(props);
}
