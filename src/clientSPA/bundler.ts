import fs from "fs";
import path from "path";
import chalk from "chalk";
import webpack, { Stats, Configuration } from "webpack";
import webpackHotMiddleware from "webpack-hot-middleware";
import webpackDevelopmentMiddleware from "webpack-dev-middleware";

import { merge } from "webpack-merge";
import { InjectManifest, GenerateSW } from "workbox-webpack-plugin";

import { formatClassName } from "../utils/text";
import { generateEntry } from "../utils/generateEntry";
import { importPathsToClientRoutes } from "../utils/route";
import { getWebpackReactConfigs } from "../webpack.config.client";

export default async function bundleClientSPA(
  props: RumboBundleClientSPAProps
): Promise<Stats | undefined> {
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

  const { entryPath } = generateEntry(
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
    { development: mode === "development" }
  );

  let entry = { [formatClassName(route)]: [`./${entryPath}`] };
  let plugins = [];

  if (pwaEnabled && mode === "production") {
    // entry["service-worker"] = [path.join(rootDir, "service-worker.ts")];
    plugins.push(
      new GenerateSW({
        skipWaiting: false,
        clientsClaim: true,
        swDest: path.join(distDir, "service-worker.js"),
        maximumFileSizeToCacheInBytes: 10000000,

        include: [/.html$/, /.js$/, /.css$/, /.jpg$/, /.png$/, /.ico$/],
      })
      // new InjectManifest({
      //   compileSrc: true,
      //   swSrc: path.join(rootDir, "service-worker.js"),
      //   swDest: path.join(distDir, "service-worker.js"),
      //   maximumFileSizeToCacheInBytes: 10000000,
      //   include: [/.html$/, /.js$/, /.css$/, /.jpg$/, /.png$/, /.ico$/]
      // })
    );
  }

  const clientConfigs = getWebpackReactConfigs({
    mode,
    publicPath,
    entry,
    route,
    distDir,
  });

  const configs: Configuration = merge(clientConfigs, dfConfigs, { plugins });

  const compiler = webpack(configs);

  if (mode === "development") {
    props.app
      .use(
        webpackDevelopmentMiddleware(compiler, {
          publicPath: configs.output?.publicPath,
          stats: true,
          serverSideRender: true,
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
      acept(stats);
    });
  });
}
