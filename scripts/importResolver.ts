import { resolveImports } from "rumbo/utils/route";
import { formatClassName } from "rumbo/utils/text";
import { rumboTempName } from "rumbo/configs";

// const { resolveImports } = require("../src/packages/rumbo/dist/utils/route");
// const { formatClassName } = require("../src/packages/rumbo/dist/utils/text");
// const { rumboTempName } = require("../src/packages/rumbo/dist/configs");

export function resolveStaticImports({ routes, buildDir }) {
  let imports: any[] = [];
  let staticRoutes = {};

  Object.entries(routes).forEach(
    ([route, { location, type, excludePaths = [] }]: [string, any]) => {
      let r = resolveImports({
        route,
        location,
        type: type === "server" ? "server" : "client",
        excludePaths
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
        const className = `clientEntry${formatClassName(route)}`;

        imports.push({
          className,
          method: "get",
          classPath: `../${rumboTempName}/${className}`,
        });
        staticRoutes[route].__rumboClientSSR = {
          staticImport: `${className}_get`,
          className: className,
        };
      }
    }
  );

  return {
    imports,
    staticRoutes,
  };
}
