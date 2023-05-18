import fs from "fs";
import path from "path";
import chalk from "chalk";
import webpack from "webpack";

import { PathProps } from "./register";

type Props = {
  entries: PathProps[]
}

export async function bundleClient(props: Props) {

  const entries = props.entries.map(e => ({
    ...e,
    name: e.handlePath.replace(/\//g, "_"),
    filePath: e.filePath.replace(/\.(js|ts|tsx)$/g, "")
  }))

  const htmlTemplate = fs.readFileSync("./public/index.html", { encoding: "utf-8" });
  const appTemplate = fs.readFileSync(path.join(__dirname, "./appTemplate"), { encoding: "utf-8" })

  const content = appTemplate
    .replace("{{imports}}", entries.map(item => `import ${item.name} from "${item.filePath}"`).join("\n"))
    .replace(/{{htmlComponent}}/g, htmlTemplate.replace("{{content}}", "<RouterProvider router={ router } />"))
    .replace("{{routes}}", entries.map(e => `{path:"${e.handlePath}",component:${e.name}}`).join(","));


  const entryPath = "./src/.fresh/tempEntry.tsx"
  fs.writeFileSync(entryPath, content);

  // @ts-ignore
  const dfConfigs = (await import(path.join(process.cwd(), "webpack.config"))).default;
  const configs = Object.assign({}, dfConfigs, {
    mode: "development",
    entry: [`./${entryPath}`, ...entries.map(item => item.filePath)],
    // output: {
    //   ...dfConfigs.output,
    //   : false
    // }
  });

  const compiler = webpack(configs);
  compiler.run((err, stats) => {
    if (err) {
      console.log(chalk.red("Pack Error", err.toString()));
      return;
    }
    console.log("Packed", stats?.hasErrors(), stats?.hasWarnings())
    if (stats?.hasErrors()) {
      console.log(stats.toString());
    }
  });
}