import fs from "fs";
import path from "path";
import chalk from "chalk";
import webpack from "webpack";

import webpackHotMiddleware from "webpack-hot-middleware";
import webpackDevelopmentMiddleware from "webpack-dev-middleware";

import { merge } from "webpack-merge";
import { formatClassName } from "../utils/text";
import { generateClient } from "../utils/generateClient";
import { getWebpackReactConfigs } from "../webpack.config.client";
import type { StatsCompilation } from "webpack";

export default function bundleClientSSR(
  props: BundleClientSSRProps
): Promise<StatsCompilation | undefined> {
  const {
    publicPath = "./public",
    route,
    distDir,
    rootDir,
    webpackConfigs = {},
    pwaEnabled = false,
  } = props;
  
  const clientConfigPath = path.join(
    path.resolve("./"),
    "webpack.config.client"
  );
  // // @ts-ignore
  let dfConfigs: webpack.Configuration = {};
  // Must be js file
  if (fs.existsSync(clientConfigPath + ".js")) {
    dfConfigs = require(clientConfigPath) || {};
  }

  let mode: WebpackMode =
    dfConfigs.mode ||
    webpackConfigs?.mode ||
    (process.env.NODE_ENV as WebpackMode) ||
    "development";

  const { entryPath } = generateClient(props, {
    includeImport: true,
    development: process.env.NODE_ENV === "development",
  });

  const clientConfigs = getWebpackReactConfigs({
    mode,
    publicPath,
    entry: { [formatClassName(route)]: [`./${entryPath}`] },
    route,
    distDir,
    pwaEnabled,
  });

  let configs: webpack.Configuration = merge(
    clientConfigs,
    dfConfigs,
    webpackConfigs
  );

  if (process.env.NODE_ENV === "development") {
    // configs = merge(configs, {});
    const compiler = webpack(configs);
    props.app
      ?.use(
        webpackDevelopmentMiddleware(compiler, {
          publicPath: configs.output?.publicPath,
          stats: true,
          serverSideRender: true,
        })
      )
      .use(
        webpackHotMiddleware(compiler, {
          log: false,
          path: path.join(route.replace("*", ""), "__webpack_hmr"),
        })
      );
    return Promise.resolve(undefined);
  }

  const compiler = webpack(configs);

  return new Promise((acept, reject) => {
    compiler.run((err, stats) => {
      let messageStr = `✓ ${route}`;

      if (err) {
        console.log(chalk.red("Packing clientSSR error: ", err.toString()));
        return reject(err);
      }

      if (stats?.compilation.errors.length) {
        console.log(chalk.red("Packing clientSSR error"));
        let errorStr = "";
        stats.compilation.errors.forEach((err, i) => {
          errorStr += `--- Error ${i + 1} ---\n: ${
            err.stack
            // "stack"
          }\n--- End of clientSSR error ${i + 1} ---\n`;
        });
        console.log(chalk.red(errorStr));
        fs.writeFileSync(
          path.join(rootDir, "../rumbo.clientSSR-error.log"),
          errorStr
        );
        console.log(chalk.red(`End packing clientSSR error`));
        return reject(`Failed`);
      }
      if (stats?.compilation.warnings.length) {
        messageStr += ` (${stats?.compilation.warnings.length} warnings)`;
        let errorStr = "";
        stats?.compilation.warnings.forEach((err, i) => {
          // console.log(chalk.gray(`--- Warning ${i}: ${err.message}`));
          errorStr += `--- Warning ${i + 1} ---\n: ${
            err.stack
          }\n--- End of warning ${i + 1} ---\n`;
        });
        fs.writeFileSync(
          path.join(rootDir, "../rumbo.clientSSR-warning.log"),
          errorStr
        );
      }

      console.log(chalk.gray(messageStr));

      acept(stats?.toJson());
    });
  });
}
