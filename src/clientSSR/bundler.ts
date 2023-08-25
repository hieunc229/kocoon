import fs from "fs";
import path from "path";
import chalk from "chalk";
import webpack from "webpack";

import { merge } from "webpack-merge";
import { rumboTempDir } from "../configs";
import { formatClassName } from "../utils/text";
import { excludeRegex, getLayoutRoute } from "../utils/route";
import { getWebpackReactConfigs } from "../webpack.config.client";

import webpackHotMiddleware from "webpack-hot-middleware";
import webpackDevelopmentMiddleware from "webpack-dev-middleware";
import HtmlWebpackPlugin from "html-webpack-plugin";

type Props = {
  entries: ResolveImportProps[];
  publicPath?: string;
  routes: ClientRoutes;
  route: string;
  distDir: string;
  debug: boolean;
  rootDir: string;
  app: any;
  webpackConfigs?: webpack.Configuration;
};

export default function bundleClientSSR(props: Props) {
  const {
    publicPath = "./public",
    routes,
    route,
    distDir,
    rootDir,
    webpackConfigs,
  } = props;

  const entries = props.entries.map((e) => ({
    ...e,
    import: require(e.filePath.replace(/\.(js|ts|tsx)$/g, "")),
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
        .map(
          (item) =>
            `import { default as ${item.name}${
              item.import.layoutProps
                ? `, layoutProps as ${item.name}_layoutProps`
                : ""
            } } from "${item.filePath}"`
        )
        .join("\n")
    )
    .replace(/{{htmlComponent}}/g, "<RouterProvider router={router} />")
    .replace(
      "{{routes}}",
      Object.entries(routes)
        .filter(([path]) => !excludeRegex.test(path))
        .map(([path, r]) => {
          const layoutHandler = getLayoutRoute(path, routes);
          const routeProps = `routeProps["${path}"]?.props`;
          if (layoutHandler) {
            let entry = entries.find((item) => item.name === r.handlerName);
            let layoutPropStr = entry?.import?.layoutProps
              ? `${r.handlerName}_layoutProps`
              : "null";
            return `{path:"${path}",props:${routeProps},element:createElement(${layoutHandler.layoutName},${layoutPropStr},createElement(${r.handlerName},${routeProps})),errorBoundary:<ErrorBoundary/>}`;
          }
          return `{path:"${path}",Component:${r.handlerName},props:${routeProps},errorBoundary:<ErrorBoundary/>}`;
        })
        .join(",")
    );

  if (!fs.existsSync(rumboTempDir)) {
    fs.mkdirSync(rumboTempDir);
  }

  const entryPath = path.join(
    rumboTempDir,
    `rumboClient${formatClassName(route)}.tsx`
  );
  fs.writeFileSync(entryPath, content);

  const clientConfigPath = path.join(
    path.resolve("./"),
    "webpack.config.client"
  );
  // // @ts-ignore
  let dfConfigs = {};
  try {
    dfConfigs = require(clientConfigPath) || {};
  } catch (e) {
    console.log(e);
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

  let configs: webpack.Configuration = merge(
    clientConfigs,
    {
      mode,
      output: {
        path: path.join(distDir, "static"),
        publicPath: "/",
        filename: `${formatClassName(route)}.js`,
      },
      resolve: {
        alias: {
          rumbo: path.resolve(__dirname, ".."),
        },
      },
    },
    dfConfigs
  );

  if (process.env.NODE_ENV === "development") {
    configs = merge(configs, {
      output: {
        publicPath: "/static",
      },
      plugins: [
        new HtmlWebpackPlugin({
          filename: path.join(distDir, route, "index.html"),
          template: path.join(distDir, "index.html"),
        }),
        new webpack.HotModuleReplacementPlugin(),
      ],
    });

    const compiler = webpack(configs);
    props.app
      .use(
        webpackDevelopmentMiddleware(compiler, {
          publicPath: "/static", // props.publicPath,
          // writeToDisk: true,
        })
      )
      .use(webpackHotMiddleware(compiler, { log: false }));
    configs.name = route;
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
          }\n--- End of error ${i + 1} ---\n`;
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
