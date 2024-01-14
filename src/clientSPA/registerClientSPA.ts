import chalk from "chalk";
import bundleClientSPA from "./bundler";

import { createElement } from "react";
import { Express, Request, Response } from "express";
import { renderToPipeableStream } from "react-dom/server";

import { formatClassName } from "../utils/text";
import { getAppComponent } from "../clientSSR/generator";

type Props = RumboBundleClientSPAProps & {
  app: Express;
  excludePaths: string[];
};

export default async function registerClientSPA(props: Props): Promise<any> {
  const {
    app,
    debug = false,
    route,
    publicPath = "",
    rootDir,
  } = props;
  
  await bundleClientSPA(props);
  

  const AppComponent = getAppComponent({
    publicPath,
    route,
    debug,
    rootDir,
  }).default;

  app.get(`${route}*`, function (_: Request, res: Response) {
    const { pipe } = renderToPipeableStream(createElement(AppComponent), {
      bootstrapScripts: [`/static/${formatClassName(route)}.js`],
      onShellReady() {
        res.setHeader("content-type", "text/html");
        pipe(res);
      },
      onError(err: any, info) {
        console.log(chalk.red("Failed to render"), { err, info });
        res.status(500).send(err.toString());
      },
    });
  });


  // createClientSSRRequest(
  //   { handler },
  //   {
  //     staticRoutes,
  //     staticHandler,
  //     AppComponent,
  //     route,
  //     clientUseRouter: true,
  //     routes: { [route]: { handler, handlerName: route, handlerPath: route }},
  //   }
  // )

  // debug && console.log(chalk.gray(`-`, route));
}
