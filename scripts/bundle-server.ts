import "ignore-styles";

import fs from "fs";
import path from "path";
import chalk from "chalk";
import webpack from "webpack";

import defaultConfigs from "./webpack.config.srv";

import { merge } from "webpack-merge";
import { resolveStaticImports } from "./utils/importResolver";

const buildDir = path.join(__dirname, "../build/src");

function updateConfigFile() {
  const configPath = path.join(buildDir, "rumboConfigs.js");

  if (!fs.existsSync(configPath)) {
    console.log(
      chalk.red(`No config file found. Please place it at ${configPath}`)
    );
    process.exit();
  }

  let content = fs.readFileSync(configPath, { encoding: "utf8" });

  if (content.indexOf("staticRoutes: null") === -1) {
    console.log(chalk.gray(`Configs file already updated`));
    return;
  }

  const data = require(configPath).default;
  const routes = data.routes;

  const { imports, staticRoutes } = resolveStaticImports({ routes, buildDir });

  content = content
    // 1. generate imports
    .replace(
      "const rumboConfigs",
      [
        ...imports
          // remove duplicates
          .filter(
            (item, i, list) =>
              list.findIndex((li) => li.classPath === item.classPath) === i
          )
          .map(
            ({ className, classPath, method }) =>
              `const ${className}_${method} = __importDefault(require("${classPath}"));`
          ),
        "const rumboConfigs",
      ].join("\n")
    )
    // 2. generate staticRoute prop
    .replace(
      "staticRoutes: null",
      `staticRoutes: {${Object.entries(staticRoutes).map(
        ([r, routes]) =>
          `"${r}": {${Object.entries(routes as any)
            .map(
              ([sr, info]: [string, any]) =>
                `"${sr}": ${JSON.stringify(info).replace(
                  `"staticImport":"${
                    info.staticImport || info.className || sr
                  }"`,
                  `"staticImport":${info.staticImport || info.className || sr}`
                )}`
            )
            .join(",")}}`
      )}}`
    );

  // 3. update content file
  fs.writeFileSync(configPath, content, { encoding: "utf8" });
  console.log(chalk.gray(`Configs updated`));
}

function run() {
  updateConfigFile();

  let userConfigs = {};

  const userConfigPath = path.join(__dirname, "../webpack.config.server");
  try {
    userConfigs = require(userConfigPath);
  } catch (e) {
    console.log(e);
  }

  let wpconfigs = merge(userConfigs, defaultConfigs);

  const compiler = webpack(wpconfigs);

  compiler.run((err, stats) => {
    if (err) {
      console.log(chalk.red("[rumbo] Bundle server error", err.toString()));
      fs.writeFileSync("./rumbo-error.log", JSON.stringify(err));
      return;
    }

    if (stats?.compilation.errors.length) {
      console.log(chalk.red("[rumbo] Bundle server error"));
      let errorStr = "";
      stats.compilation.errors.forEach((err, i) => {
        errorStr += `--- Error ${i + 1} ---\n: ${
          err.stack
        }\n--- End of server error ${i + 1} ---\n`;
      });
      console.log(chalk.red(errorStr));
      fs.writeFileSync("./rumbo-error.log", errorStr);
      return;
    }

    if (stats?.compilation.warnings.length) {
      console.log(chalk.red("Packing warnings"));
      stats?.compilation.warnings.forEach((err) => {
        console.log(chalk.gray("- ", err.message));
      });
      return;
    }

    console.log(chalk.gray(`- Packing completed`));
  });
}

run();
