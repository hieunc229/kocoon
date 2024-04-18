import { resolveImports } from "rumbo/utils/route";
import { formatClassName } from "rumbo/utils/text";
import { rumboTempName } from "rumbo/configs";

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

      // if (type === "client-ssr") {
      //   const className = `clientEntry${formatClassName(route)}`;

      //   imports.push({
      //     className,
      //     method: "get",
      //     classPath: `../${rumboTempName}/${className}`,
      //   });
      //   staticRoutes[route].__rumboClientSSR = {
      //     staticImport: `${className}_get`,
      //     className: className,
      //   };
      // }
      const className = `rumboEntry`;
      const clientName = `rumboClient${formatClassName(route)}`;
      const classPath = `../${rumboTempName}/${className}`;
      const clientPath = `../${rumboTempName}/${clientName}`

      switch (type) {
        case "client-ssr":
          imports.push({
            className,
            method: "get",
            classPath, //path.join(buildDir, rumboTempName, className),
          });

          imports.push({
            className: clientName,
            method: "get",
            classPath: clientPath, //path.join(buildDir, rumboTempName, clientName),
          });

          staticRoutes[route].__rumboEntrySSR = {
            staticImport: `${className}_get`,
            className: `${className}_get`,
          };

          staticRoutes[route].__rumboClientSSR = {
            staticImport: `${clientName}_get`,
            className: `${clientName}_get`,
          };
          break;
        case "client-spa":
          imports.push({
            className,
            method: "get",
            classPath: classPath,
          });

          imports.push({
            className: clientName,
            method: "get",
            classPath: clientPath,
          });
          staticRoutes[route].__rumboEntrySPA = {
            staticImport: `${className}_get`,
            className: `${className}_get`,
          };

          staticRoutes[route].__rumboClientSPA = {
            staticImport: `${clientName}_get`,
            className: `${clientName}_get`,
          };
          break;
      }
    }
  );

  return {
    imports,
    staticRoutes,
  };
}
