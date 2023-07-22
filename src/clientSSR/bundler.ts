import fs from "fs";
import path from "path";
import chalk from "chalk";
import webpack from "webpack";
import { ClientRoutes, PathProps } from "./utils";
import { WebpackMode, getWebpackReactConfigs } from "../webpack.config.client";
import { rumboTempDir } from "../configs";

type Props = {
  entries: PathProps[];
  publicPath?: string;
  routes: ClientRoutes;
  route: string;
  distDir: string;
};

export async function bundleClientSSR(props: Props) {
  const { publicPath = "./public", routes, route, distDir } = props;

  const entries = props.entries.map((e) => ({
    ...e,
    name: e.handlePath.replace(/(\/|:)/g, "_"),
    filePath: e.filePath.replace(/\.(js|ts|tsx)$/g, ""),
  }));

  const templateEntry = fs.readFileSync(
    path.join(__dirname, "./templateClient.tpl"),
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

  const entryPath = path.join(rumboTempDir, "rumboClient.tsx");
  fs.writeFileSync(entryPath, content);

  // @ts-ignore
  let dfConfigs = {};
  const clientConfigPath = path.join(process.cwd(), "webpack.config.client");

  try {
    dfConfigs = (require(clientConfigPath)).default || {};
  } catch (e) {
    // no client config
  }

  let mode: WebpackMode =
    (process.env.NODE_ENV as WebpackMode) || "development";

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
        path: distDir,
        publicPath: "/",
        filename: `${route.replace(/\//, "_")}.js`,
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

      console.log(chalk.gray(`- Packing SSR client ${route} completed`));
      acept({});
    });
  });
}
