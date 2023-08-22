const { resolveImports } = require("../src/packages/rumbo/dist/utils/route");
const { formatClassName } = require("../src/packages/rumbo/dist/utils/text");
const { rumboTempName } = require("../src/packages/rumbo/dist/configs");

// import { ResolveImportServerProps, resolveImports } from "../src/packages/rumbo/dist/utils/route";
// import { formatClassName } from "../src/packages/rumbo/dist/utils/text";
// import { rumboTempName } from "../src/packages/rumbo/dist/configs";

function resolveStaticImports({ routes, buildDir }) {
  let imports = [];
  let staticRoutes = {};

  Object.entries(routes).forEach(([route, { location, type }]) => {
    let r = resolveImports({
      route,
      location,
      type: type === "server" ? "server" : "client",
    });
    imports = imports.concat(
      r.map(({ handlePath, filePath, method }) => ({
        className: formatClassName(handlePath),
        method,
        classPath: filePath.replace(buildDir, ".").replace(".js", ""),
      }))
    );
    
    staticRoutes[route] = {};

    r.forEach((item) => {
      let className = `${formatClassName(item.handlePath)}_${item.method}`;
      staticRoutes[route][className] = {
        ...item,
        staticImport: className,

      };
    });

    if (type === "client-ssr") {
      const className = `clientEntry${formatClassName(route)}`
      
      imports.push({
        className,
        method: "get",
        classPath: `../${rumboTempName}/${className}`
      })
      staticRoutes[route].__rumboClientSSR = {
        staticImport: `${className}_get`,
        className: className
      };
    }
  });

  return {
    imports,
    staticRoutes,
  };
}

module.exports = { resolveStaticImports }