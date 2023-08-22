require("ignore-styles")
const path = require("path");
const fse = require("fs-extra");
const {
  resolveImports,
  importPathsToClientRoutes,
} = require("../src/packages/rumbo/dist/utils/route");

const bundleClientSSR =
  require("../src/packages/rumbo/dist/clientSSR/bundler").default;
const generateClientSSRApp =
  require("../src/packages/rumbo/dist/clientSSR/generator").default;
// const configs = require("../src/rumboConfigs");
// const { rumboTempName } = require("../build/src/packages/rumbo/dist/configs")
// const { formatClassName } = require("../build/src/packages/rumbo/dist/utils/text")

import configs from "../src/rumboConfigs";
import { rumboTempName } from "../src/packages/rumbo/src/configs";
import { formatClassName } from "../src/packages/rumbo/src/utils/text";

function __bundleSSRClient({ route, item, publicPath, distDir, rootDir }) {
  const { location } = item;

  const entries = resolveImports({
    route,
    location,
    type: "client",
  }).map((item) => ({
    ...item,
    staticImport: require(item.filePath),
  }));

  const routes = importPathsToClientRoutes({ paths: entries });

  const componentPath = path.join(
    rootDir,
    rumboTempName,
    `clientEntry${formatClassName(route)}.tsx`
  );

  generateClientSSRApp({
    componentPath,
    publicPath,
    route,
    debug: true,
    webpackConfigs: {
      mode: "production",
    },
  });

  return bundleClientSSR({
    entries,
    publicPath,
    routes,
    route,
    distDir,
    debug: true,
    rootDir
  });
}

async function buildClient() {
  const { routes } = configs;
  const rootDir = path.join(__dirname, "..");
  const publicPath = path.join(__dirname, "../public");
  const distDir = path.join(rootDir, "dist");

  if (distDir !== publicPath) {
    fse.copySync(publicPath, distDir);
  }

  for (const [route, item] of Object.entries(routes)) {
    // @ts-ignore
    switch (item.type) {
      case "client-ssr":
        await __bundleSSRClient({ route, item, publicPath, distDir, rootDir });
        break;
    }
  }
}

buildClient();
