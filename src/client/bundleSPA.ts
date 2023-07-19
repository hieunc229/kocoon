import fs from "fs";
import path from "path";
import chalk from "chalk";
import webpack from "webpack";

import { ClientRoutes, PathProps } from "./register";

type Props = {
  dirPath: string;
  publicPath?: string;
};

export async function bundleReactSPAClient(props: Props) {
  const { publicPath = "./public", dirPath } = props;

  const entryPath = path.join(dirPath, "index.tsx");

  // @ts-ignore
  let dfConfigs = {};
  const clientConfigPath = path.join(process.cwd(), "webpack.config.client");

  try {
    dfConfigs = (await import(clientConfigPath)).default || {};
  } catch (e) {
    // no client config
  }

  const configs: webpack.Configuration = Object.assign({}, dfConfigs, {
    mode: "development" as any,
    entry: [`./${entryPath}`],
    output: {
      path: publicPath,
      filename: "bundle.js",
    },
    module: {
      rules: [
        {
          test: /\.(tsx|ts)?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
  });

  const compiler = webpack(configs);

  compiler.run((err) => {
    if (err) {
      console.log(chalk.red("Pack Error", err.toString()));
      return;
    }

    console.log(chalk.green("Packing completed"));
  });
}
