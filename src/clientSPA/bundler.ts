import fs from "fs";
import path from "path";
import chalk from "chalk";
import webpack from "webpack";

import { merge } from "webpack-merge";
import { formatClassName } from "../utils/text";
import { getWebpackReactConfigs } from "../webpack.config.client";

import webpackHotMiddleware from "webpack-hot-middleware";
import webpackDevelopmentMiddleware from "webpack-dev-middleware";
import { generateEntry } from "../utils/generateEntry";
import { importPathsToClientRoutes } from "../utils/route";

export default async function bundleClientSPA(
  props: RumboBundleClientSPAProps
): Promise<any> {
  const {
    publicPath = "./public",
    location,
    distDir,
    route,
    debug,
    rootDir,
    webpackConfigs,
  } = props;

  const entries = [
    {
      filePath: location + ".tsx",
      handlePath: `${route}*`,
      // staticImport: require(path.join(location, "index")),
    },
  ];

  const { entryPath } = generateEntry({
    appProps: { renderStrategy: "auto", routes: {}, staticRoutes: [] } as any,
    route,
    routes: importPathsToClientRoutes({ paths: entries }),
    entries,
  });

  let dfConfigs = {};
  const clientConfigPath = path.join(
    path.resolve("./"),
    "webpack.config.client"
  );

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

  // console.log(path.join(distDir, route, "index.html"), path.join(distDir, "index.html"), path.join(distDir, "static"))

  const configs: webpack.Configuration = merge(
    clientConfigs,
    {
      output: {
        path: path.join(distDir, "/static"),
        filename: `${formatClassName(route)}.js`,
        publicPath: "/static",
      },
    },
    dfConfigs
  );


  const compiler = webpack(configs);

  if (process.env.NODE_ENV === "development") {
    props.app
      .use(
        webpackDevelopmentMiddleware(compiler, {
          publicPath: configs.output?.publicPath,
        })
      )
      .use(
        webpackHotMiddleware(compiler, {
          path: path.join(route, "__webpack_hmr"),
        })
      );
    return Promise.resolve();
  }

  return new Promise((acept, reject) => {
    compiler.run((err, stats) => {
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
          path.join(rootDir, "rumbo.clientSPA-error.log"),
          errorStr
        );

        console.log(chalk.red(`End packing clientSPA error`));
        return reject(`Failed`);
      }

      if (stats?.compilation.warnings.length) {
        console.log(chalk.gray("Packing completed with warnings"));
        let errorStr = "";
        stats?.compilation.warnings.forEach((err, i) => {
          errorStr += `--- Error ${i + 1} ---\n: ${
            err.stack
          }\n--- End of warning ${i + 1} ---\n`;
        });
        console.log(chalk.gray(errorStr));
        fs.writeFileSync(
          path.join(rootDir, "rumbo.clientSPA-warning.log"),
          errorStr
        );
        return acept({});
      }

      console.log(chalk.gray(`- Pack SPA client ${route} completed`));
      acept({});
    });
  });
}
