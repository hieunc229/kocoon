import path from "path";
import bundleClientSPA from "./bundler";

import { Express } from "express";

type Props = RumboBundleClientSPAProps & {
  app: Express;
};

export default async function registerClientSPA(props: Props): Promise<any> {
  const { app, distDir, route } = props;
  app.get(`${route}*`, function (_, res) {
    res.sendFile(path.join(distDir, route, "index.html"));
  });
  return bundleClientSPA(props);
}
