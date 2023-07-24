import path from "path";
import chalk from "chalk";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";

import { formatClassName } from "../utils/text";
import { RumboStaticRoute } from "../utils/route";
import { WebpackMode, getWebpackReactConfigs } from "../webpack.config.client";

export type RumboBundleClientSPAProps = {
  location: string;
  publicPath?: string;
  distDir: string;
  route: string;
  debug?: boolean;
  staticImports: null | {
    [subRoute: string]: RumboStaticRoute;
  };
  webpackConfigs?: webpack.Configuration;
};

export default async function bundleClientSPA(
  props: RumboBundleClientSPAProps
): Promise<any> {
  const {
    publicPath = "./public",
    location,
    distDir,
    route,
    debug,
    webpackConfigs,
  } = props;

  const entryPath = path.join(location, "index.tsx");

  let dfConfigs = {};
  const clientConfigPath = path.join(process.cwd(), "webpack.config.client");
  try {
    dfConfigs = require(clientConfigPath).default || {};
    debug &&
      console.log(
        `staticImports spa.userConfigFile ${formatClassName(
          route
        )} (${clientConfigPath})`
      );
  } catch (e) {
    // no client config
  }

  let mode: WebpackMode =
    webpackConfigs?.mode ||
    (process.env.NODE_ENV as WebpackMode) ||
    "development";

  const clientConfigs = getWebpackReactConfigs({
    mode,
    publicPath,
    entry: [entryPath],
    route,
  });

  const configs: webpack.Configuration = Object.assign(
    {},
    dfConfigs,
    clientConfigs,
    {
      mode,
      output: {
        path: path.join(distDir, "static"),
        filename: `${formatClassName(route)}.js`,
        publicPath: "/",
      },
      plugins: [
        new HtmlWebpackPlugin({
          template: path.join(distDir, "index.html"),
        }),
        ...(clientConfigs.plugins || []),
      ],
    }
  );

  debug && console.log(chalk.green(`[Client SSR]`, route));

  const compiler = webpack(configs);
  return new Promise((acept, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        console.log(chalk.red("Packing error", err.toString()));
        return reject(err);
      }

      if (stats?.compilation.errors.length) {
        console.log(chalk.red("Packing error"));
        stats?.compilation.errors.forEach((err) => {
          console.log(chalk.red("- ", err.message));
        });
        return reject(`Failed`);
      }

      if (stats?.compilation.warnings.length) {
        console.log(chalk.gray("Packing completed with warnings"));
        stats?.compilation.warnings.forEach((err) => {
          console.log(chalk.red("- ", err.message));
        });
        return acept({});
      }

      console.log(chalk.gray(`- Pack SPA client ${route} completed`));
      acept({});
    });
  });
}
