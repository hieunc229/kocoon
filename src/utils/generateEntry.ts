import path from "path";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

import { formatClassName } from "./text";
import { rumboTempDir } from "../configs";
import { excludeRegex, getLayoutRoute } from "./route";

export function generateEntry(props: GenerateEntryProps, options?: { includeImport?: boolean }) {
  const { routes, route, appProps } = props;
  const { includeImport = false } = options || {}

  const { renderStrategy = "auto", pwaEnabled = false } = appProps;
  const entries = props.entries.map((e) => ({
    ...e,
    import: includeImport ? require(e.filePath.replace(/\.(js|ts|tsx)$/g, "")) : undefined,
    name: formatClassName(e.handlePath),
    filePath: e.filePath.replace(/\.(js|ts|tsx)$/g, ""),
  }));

  const templateEntry = readFileSync(
    path.join(__dirname, "../templates/templateClient.tpl"),
    {
      encoding: "utf-8",
    }
  );

  const content = templateEntry
    .replace(
      "{{imports}}",
      entries
        .map(
          (item) =>
            `import { default as ${item.name}${
              item.import?.layoutProps
                ? `, layoutProps as ${item.name}_layoutProps`
                : ""
            } } from "${item.filePath}"`
        )
        .join("\n")
    )
    .replace(/{{htmlComponent}}/g, "<RouterProvider router={router} />")
    .replace(
      "{{routes}}",
      Object.entries(routes)
        .filter(([path]) => !excludeRegex.test(path))
        .map(([path, r]) => {
          const layoutHandler = getLayoutRoute(path, routes);
          const routeProps = `routeProps["${path}"]?.props`;
          if (layoutHandler) {
            let entry = entries.find((item) => item.name === r.handlerName);
            let layoutPropStr = entry?.import?.layoutProps
              ? `${r.handlerName}_layoutProps`
              : "null";
            return `{path:"${path}",props:${routeProps},element:createElement(${layoutHandler.layoutName},${layoutPropStr},createElement(${r.handlerName},${routeProps})),errorBoundary:<ErrorBoundary/>}`;
          }
          return `{path:"${path}",Component:${r.handlerName},props:${routeProps},errorBoundary:<ErrorBoundary/>}`;
        })
        .join(",")
    )
    .replace("<html", "<!DOCTYPE html>\n<html")
    .replace(`pwaEnabled`, `${pwaEnabled}`)
    .replace(`NODE_ENV`, `"${process.env.NODE_ENV}"`)
    .replace(`renderStrategy`, `"${renderStrategy}"`);

  if (!existsSync(rumboTempDir)) {
    mkdirSync(rumboTempDir);
  }

  const entryPath = path.join(
    rumboTempDir,
    `rumboClient${formatClassName(route)}.tsx`
  );

  writeFileSync(entryPath, content);

  return { entryPath }
}
