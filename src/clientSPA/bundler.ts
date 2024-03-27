import fs from "fs";
import path from "path";
import chalk from "chalk";
import webpack from "webpack";
import webpackHotMiddleware from "webpack-hot-middleware";
import webpackDevelopmentMiddleware from "webpack-dev-middleware";

import type { StatsCompilation, Configuration } from "webpack";

import { merge } from "webpack-merge";

import { formatClassName } from "../utils/text";
import { generateClient } from "../utils/generateClient";
import { importPathsToClientRoutes } from "../utils/route";
import { getWebpackReactConfigs } from "../webpack.config.client";

export default async function bundleClientSPA(
  props: RumboBundleClientSPAProps
): Promise<StatsCompilation | undefined> {
  const {
    publicPath = "./public",
    location,
    distDir,
    route,
    debug,
    rootDir,
    webpackConfigs,
    pwaEnabled = false,
  } = props;

  const entries = [
    {
      filePath: location + ".tsx",
      handlePath: `${route}*`,
      // staticImport: require(path.join(location, "index")),
    },
  ];

  let dfConfigs: Configuration = {};
  const clientConfigPath = path.join(
    path.resolve("./"),
    "webpack.config.client"
  );

  // Must be js file
  if (fs.existsSync(clientConfigPath + ".js")) {
    dfConfigs = require(clientConfigPath) || {};
  }

  let mode: WebpackMode =
    dfConfigs.mode ||
    webpackConfigs?.mode ||
    (process.env.NODE_ENV as WebpackMode) ||
    "development";

  const { entryPath } = generateClient(
    {
      appProps: {
        renderStrategy: "auto",
        routes: {},
        staticRoutes: [],
        pwaEnabled,
      } as any,
      route,
      routes: importPathsToClientRoutes({ paths: entries }),
      entries,
    },
    { development: process.env.NODE_ENV === "development" }
  );

  let entry = { [formatClassName(route)]: [`./${entryPath}`] };

  const clientConfigs = getWebpackReactConfigs({
    mode,
    publicPath,
    entry,
    route,
    distDir,
    pwaEnabled
  });

  const configs: Configuration = merge(clientConfigs, dfConfigs);
  const compiler = webpack(configs);

  if (process.env.NODE_ENV === "development") {
    props.app
      .use(
        webpackDevelopmentMiddleware(compiler, {
          publicPath: configs.output?.publicPath,
          stats: true,
          serverSideRender: false,
        })
      )
      .use(
        webpackHotMiddleware(compiler, {
          path: path.join(route.replace("*", ""), "__webpack_hmr"),
        })
      );
    return Promise.resolve(undefined);
  }

  return new Promise((acept, reject) => {
    compiler.run((err, stats) => {
      let messageStr = `✓ ${route}`;
      if (err) {
        console.log(chalk.red("Packing clientSPA error: ", err.toString()));
        return reject(err);
      }

      if (stats?.compilation.errors.length) {
        console.log(chalk.red("Packing clientSPA error"));
        let errorStr = "";
        stats.compilation.errors.forEach((err, i) => {
          errorStr += `--- Error ${i + 1} ---\n: ${
            err.stack
          }\n--- End of clientSPA error ${i + 1} ---\n`;
        });
        console.log(chalk.red(errorStr));
        fs.writeFileSync(
          path.join(rootDir, "../rumbo.clientSPA-error.log"),
          errorStr
        );

        console.log(chalk.red(`End packing clientSPA error`));
        return reject(`Failed`);
      }

      if (stats?.compilation.warnings.length) {
        let errorStr = "";
        messageStr += ` (${stats?.compilation.warnings.length} warnings)`;

        stats?.compilation.warnings.forEach((err, i) => {
          // console.log(chalk.gray(`--- Warning ${i}: ${err.message}`));
          errorStr += `  - Warning ${i + 1} ---\n: ${
            err.stack
          }\n--- End of warning ${i + 1} ---\n`;
        });
        fs.writeFileSync(
          path.join(rootDir, "../rumbo.clientSPA-warning.log"),
          errorStr
        );
      }

      console.log(chalk.gray(messageStr));
      acept(stats?.toJson());
    });
  });
}
