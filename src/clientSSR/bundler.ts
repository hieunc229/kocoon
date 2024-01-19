import fs from "fs";
import path from "path";
import chalk from "chalk";
import webpack from "webpack";

import webpackHotMiddleware from "webpack-hot-middleware";
import webpackDevelopmentMiddleware from "webpack-dev-middleware";

import { merge } from "webpack-merge";
import { formatClassName } from "../utils/text";
import { generateEntry } from "../utils/generateEntry";
import { getWebpackReactConfigs } from "../webpack.config.client";

export default function bundleClientSSR(props: BundleClientSSRProps) {
  const {
    publicPath = "./public",
    route,
    distDir,
    rootDir,
    webpackConfigs = {},
  } = props;

  const { entryPath } = generateEntry(props, { includeImport: true });
  const clientConfigPath = path.join(
    path.resolve("./"),
    "webpack.config.client"
  );
  // // @ts-ignore
  let dfConfigs = {};
  // Must be js file
  if (fs.existsSync(clientConfigPath + ".js")) {
    dfConfigs = require(clientConfigPath) || {};
  }
  
  let mode: WebpackMode =
    webpackConfigs?.mode ||
    (process.env.NODE_ENV as WebpackMode) ||
    "development";

  const clientConfigs = getWebpackReactConfigs({
    mode,
    publicPath,
    entry: [`./${entryPath}`],
    route,
    distDir,
  });

  let configs: webpack.Configuration = merge(
    clientConfigs,
    {
      mode,
      output: {
        path: path.join(distDir, "/static"),
        filename: `${formatClassName(route)}.js`,
        publicPath: "/static/",
      },
    },
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
        })
      )
      .use(
        webpackHotMiddleware(compiler, {
          log: false,
          path: path.join(route, "__webpack_hmr"),
        })
      );
    return Promise.resolve();
  }

  const compiler = webpack(configs);

  return new Promise((acept, reject) => {
    compiler.run((err, stats) => {
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
          path.join(rootDir, "rumbo.clientSSR-error.log"),
          errorStr
        );
        console.log(chalk.red(`End packing clientSSR error`));
        return reject(`Failed`);
      }

      console.log(chalk.gray(`- Packing SSR client ${route} completed`));
      acept({});
    });
  });
}
