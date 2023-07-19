import fs from "fs";
import path from "path";
import chalk from "chalk";
import webpack from "webpack";

import { ClientRoutes, PathProps } from "./register";

type Props = {
  entries: PathProps[];
  publicPath?: string;
  routes: ClientRoutes;
};

export async function bundleClient(props: Props) {
  const { publicPath = "./public", routes } = props;

  const entries = props.entries.map((e) => ({
    ...e,
    name: e.handlePath.replace(/(\/|:)/g, "_"),
    filePath: e.filePath.replace(/\.(js|ts|tsx)$/g, ""),
  }));

  const htmlTemplate = fs.readFileSync(`${publicPath}/index.html`, {
    encoding: "utf-8",
  });

  const appTemplate = fs.readFileSync(
    path.join(__dirname, "../appTemplate.tpl"),
    {
      encoding: "utf-8",
    }
  );

  const content = appTemplate
    .replace(
      "{{imports}}",
      entries
        .map((item) => `import ${item.name} from "${item.filePath}"`)
        .join("\n")
    )
    .replace(
      /{{htmlComponent}}/g,
      htmlTemplate.replace("{{content}}", "<RouterProvider router={router} />")
    )
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

  const tempDir = "./.reroute";

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const entryPath = path.join(tempDir, "tempEntry.tsx");
  fs.writeFileSync(entryPath, content);

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
    entry: [`./${entryPath}`, ...entries.map((item) => item.filePath)],
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
