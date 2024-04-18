import "ignore-styles";

import path from "path";
import fse from "fs-extra";
// import bundleClientSPA from "rumbo/clientSPA/bundler";

import bundleClientSPA from "rumbo/clientSPA/bundler";

import { writeStats } from "./utils/writeStats";
import { resolveImports } from "rumbo/utils/route";
import { formatClassName } from "rumbo/utils/text";

const srcDir = path.join(__dirname, "../src");
const buildDir = path.join(__dirname, "../build");

async function __bundleSPAClient({
  route,
  item,
  publicPath,
  distDir,
  rootDir,
}) {
  const { location, excludePaths = [] } = item;
  const staticImports = resolveImports({
    route,
    location,
    type: "client",
    excludePaths,
  }).map((item) => ({
    ...item,
    // staticImport: require(item.filePath),
  }));

  const stats = await bundleClientSPA({
    location,
    publicPath,
    distDir,
    route,
    rootDir,
    staticImports,
    debug: true,
    mode: "production",
  });

  writeStats(path.join(buildDir, `__rumbo/${formatClassName(route)}.stats.json`), stats);
}

async function buildClient() {
  const configPath = path.join(srcDir, "rumboConfigs.ts");
  const configs = require(configPath).default;
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
      case "client-spa":
        await __bundleSPAClient({ route, item, publicPath, distDir, rootDir });
        break;
    }
  }
}

buildClient();
