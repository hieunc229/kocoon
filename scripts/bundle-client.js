require("ignore-styles");

const path = require("path");
const fse = require("fs-extra");
const { resolveImports } = require("../src/packages/rumbo/dist/utils/route");
const bundleClientSPA =
  require("../src/packages/rumbo/dist/clientSPA/registerClientSPA").default;

const buildDir = path.join(__dirname, "../build/src");

function __bundleSPAClient({ route, item, publicPath, distDir }) {
  const { location } = item;

  const staticImports = resolveImports({
    route,
    location,
    type: "client",
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
