require("ignore-styles").default(['.css', '.scss']);

import path from "path";
import fse from "fs-extra";
import bundleClientSPA from "rumbo/clientSPA/registerClientSPA"

import { resolveImports } from "rumbo/utils/route";

const buildDir = path.join(__dirname, "../build/src");

function __bundleSPAClient({ route, item, publicPath, distDir }) {
  
  const { location, excludePaths = [] } = item;
  const staticImports = resolveImports({
    route,
    location,
    type: "client",
    excludePaths
  }).map((item) => ({
    ...item,
    staticImport: require(item.filePath),
  }));

  return bundleClientSPA({
    location,
    publicPath,
    distDir,
    route,
    staticImports,
    debug: true,
    mode: "production",
  });
}

async function buildClient() {
  const configPath = path.join(buildDir, "rumboConfigs.js");
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
        await __bundleSPAClient({ route, item, publicPath, distDir });
        break;
    }
  }
}

buildClient();
