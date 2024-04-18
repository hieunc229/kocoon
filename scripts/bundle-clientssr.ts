import "ignore-styles";

import path from "path";
import fse from "fs-extra";

import bundleClientSSR from "rumbo/clientSSR/bundler";
import generateClientSSRApp from "rumbo/clientSSR/generator";

import configs from "../src/rumboConfigs";
import webpackConfigs from "./webpack.config.ssr";

import { rumboTempName } from "rumbo/configs";
import { writeStats } from "./utils/writeStats";
import { formatClassName } from "rumbo/utils/text";
import { resolveImports, importPathsToClientRoutes } from "rumbo/utils/route";

const buildDir = path.join(__dirname, "../build");
const rootDir = path.join(__dirname, "..");
const publicPath = path.join(__dirname, "../public");
const distDir = path.join(rootDir, "dist");

async function __bundleSSRClient({
  route,
  item,
  publicPath,
  distDir,
  rootDir,
  appProps,
}) {
  const { location, excludePaths = [], pwaEnabled } = item;

  const entries = resolveImports({
    route,
    location,
    type: "client",
    excludePaths,
  }).map((item) => {
    return {
      ...item,
      staticImport: require(item.filePath),
    };
  });

  const routes = importPathsToClientRoutes({ paths: entries });

  const componentPath = path.join(rootDir, rumboTempName, `rumboEntry.tsx`);

  generateClientSSRApp({
    componentPath,
    publicPath,
    route,
    debug: true,
  });

  const stats = await bundleClientSSR({
    entries,
    publicPath,
    routes,
    route,
    distDir,
    debug: true,
    rootDir,
    webpackConfigs,
    appProps,
    pwaEnabled,
  });

  writeStats(
    path.join(buildDir, `__rumbo/${formatClassName(route)}.stats.json`),
    stats
  );
}

async function buildClient() {
  const { routes } = configs;

  if (distDir !== publicPath) {
    fse.copySync(publicPath, distDir);
  }

  for (const [route, item] of Object.entries(routes)) {
    // @ts-ignore
    switch (item.type) {
      case "client-ssr":
        await __bundleSSRClient({
          route,
          item,
          publicPath,
          distDir,
          rootDir,
          appProps: configs,
        });
        break;
    }
  }
}

buildClient();
