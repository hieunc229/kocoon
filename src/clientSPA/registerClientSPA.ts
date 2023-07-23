import path from "path";
import chalk from "chalk";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";

import { Express } from "express";
import { WebpackMode, getWebpackReactConfigs } from "../webpack.config.client";
import { formatClassName } from "../utils";

type Props = {
  location: string;
  publicPath?: string;
  distDir: string;
  route: string;
  app: Express;
  debug?: boolean;
};

export default async function registerClientSPA(props: Props): Promise<any> {
  const { app, publicPath = "./public", location, distDir, route, debug } = props;

  app.get(`${route}*`, function (_, res) {
    res.sendFile(path.join(distDir, route, "index.html"));
  });

  const entryPath = path.join(location, "index.tsx");

  let dfConfigs = {};
  const clientConfigPath = path.join(process.cwd(), "webpack.config.client");

  try {
    dfConfigs = require(clientConfigPath).default || {};
  } catch (e) {
    // no client config
  }

  let mode: WebpackMode =
    (process.env.NODE_ENV as WebpackMode) || "development";

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
