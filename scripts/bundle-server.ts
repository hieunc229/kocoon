
require("ignore-styles").default(['.css', '.scss']);

import path from "path";
import { resolveStaticImports } from "./importResolver";

const fs = require("fs");
const chalk = require("chalk");
const webpack = require("webpack");

const defaultConfigs = require("./webpack.config");
const { merge } = require("webpack-merge");

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
        ...imports.map(
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

  const userConfigPath = "../webpack.config.server";
  try {
    userConfigs = require(userConfigPath);
  } catch (e) {}

  let wpconfigs = merge(userConfigs, defaultConfigs, {
    // stats: "verbose",
    mode: "production",
    // resolve: {
    //   alias: {
    //     rumbo: "../src/packages/rumbo/dist",
    //   },
    // },
    // plugins: [
    //   // @ts-ignore
    //   new CopyPlugin({
    //     patterns: ["./schema.prisma"]
    //   }), // without this the prisma generate above will not work
    // ],
  });

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
        errorStr += `--- Error ${i + 1} ---\n: ${err.stack}\n--- End of error ${
          i + 1
        } ---\n`;
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
