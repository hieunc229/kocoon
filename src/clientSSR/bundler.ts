import fs from "fs";
import path from "path";
import chalk from "chalk";
import webpack from "webpack";

import { ClientRoutes } from "./utils";
import { rumboTempDir } from "../configs";
import { formatClassName } from "../utils/text";
import { ResolveImportProps } from "../utils/route";
import { WebpackMode, getWebpackReactConfigs } from "../webpack.config.client";

type Props = {
  entries: ResolveImportProps[];
  publicPath?: string;
  routes: ClientRoutes;
  route: string;
  distDir: string;
  debug: boolean;
  webpackConfigs?: webpack.Configuration;
};

export default function bundleClientSSR(props: Props) {
  const {
    publicPath = "./public",
    routes,
    route,
    distDir,
    webpackConfigs,
  } = props;
  const entries = props.entries
    // // remove __rumboClientSSR
    // .filter((e) => e.handlePath)
    .map((e) => ({
      ...e,
      name: formatClassName(e.handlePath),
      filePath: e.filePath.replace(/\.(js|ts|tsx)$/g, ""),
    }));

  const templateEntry = fs.readFileSync(
    path.join(__dirname, "../templates/templateClient.tpl"),
    {
      encoding: "utf-8",
    }
  );

  const content = templateEntry
    .replace(
      "{{imports}}",
      entries
        .map((item) => `import ${item.name} from "${item.filePath}"`)
        .join("\n")
    )
    .replace(/{{htmlComponent}}/g, "<RouterProvider router={router} />")
    .replace(
      "{{routes}}",
      Object.entries(routes)
        .map(([path, r]) => {
          if (r.layoutName) {
            return `{path:"${path}",element:createElement(${r.layoutName},null,createElement(${r.handlerName}))}`;
          }
          return `{path:"${path}",Component:${r.handlerName}}`;
        })
        .join(",")
    );

  if (!fs.existsSync(rumboTempDir)) {
    fs.mkdirSync(rumboTempDir);
  }

  const entryPath = path.join(rumboTempDir, "rumboClient.tsx");
  fs.writeFileSync(entryPath, content);

  const clientConfigPath = path.join(process.cwd(), "webpack.config.client");
  // // @ts-ignore
  let dfConfigs = {};
  try {
    dfConfigs = require(clientConfigPath).default || {};
    // debug &&
    //   console.log(
    //     `staticImports ssr.bundler.userConfigFile ${formatClassName(
    //       route
    //     )} (${clientConfigPath})`
    //   );
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
    entry: [`./${entryPath}`],
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
        publicPath: "/",
        filename: `${formatClassName(route)}.js`,
      },
      resolve: {
        ...clientConfigs.resolve,
        alias: {
          ...clientConfigs.resolve?.alias,
          rumbo: path.resolve(__dirname, ".."),
        },
      },
    }
  );

  const compiler = webpack(configs);

  return new Promise((acept, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        console.log(chalk.red("Packing clientSSR error", err.toString()));
        return reject(err);
      }

      if (stats?.compilation.errors.length) {
        console.log(chalk.red("Packing clientSSR error"));
        stats?.compilation.errors.forEach((err) => {
          console.log(chalk.red("- ", err.message));
        });
        return reject(`Failed`);
      }

      console.log(chalk.gray(`- Packing SSR client ${route} completed`));
      acept({});
    });
  });
}