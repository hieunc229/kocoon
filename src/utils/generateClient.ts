import path from "path";

import { existsSync, mkdirSync, writeFileSync } from "fs";

import { formatClassName } from "./text";
import { rumboTempDir } from "../configs";
import { excludeRegex, getLayoutRoute } from "./route";

import templateClient from "../templates/client.tpl";

export function generateClient(
  props: GenerateEntryProps,
  options: { includeImport?: boolean; development: boolean }
) {
  const { routes, route, appProps, pwaEnabled = false } = props;
  const { includeImport = false, development } = options || {};

  const { renderStrategy = "auto" } = appProps;
  const entries = props.entries.map((e) => ({
    ...e,
    import: includeImport
      ? require(e.filePath.replace(/\.(js|ts|tsx)$/g, ""))
      : undefined,
    name: formatClassName(e.handlePath),
    filePath: e.filePath.replace(/\.(js|ts|tsx)$/g, ""),
  }));

  const importPaths = entries.map(
    (item) =>
      `import { default as ${item.name}${
        item.import?.layoutProps
          ? `, layoutProps as ${item.name}_layoutProps`
          : ""
      } } from "${item.filePath}"`
  );

  if (pwaEnabled) {
    importPaths.push(
      `import { register } from "persei/serviceWorkerRegistration";`
    );
  }

  if (development) {
    importPaths.push(
      `import { AppContainer } from 'react-hot-loader';`,
      `import { render } from "@hot-loader/react-dom";`,
      `import { StrictMode } from "react"`
    );
  } else {
    importPaths.push(`import { hydrateRoot } from "react-dom/client";`);
  }

  let renderContent = development
    ? `render(
    <StrictMode>
      <AppContainer>{ClientComponent}</AppContainer>
    </StrictMode>,
    root
  );

  if (module["hot"]) {
    module["hot"].accept();
  }`
    : `hydrateRoot(root, ClientComponent)`;
  // : "createRoot(root).render(<StrictMode>{ClientComponent}</StrictMode>);";

  let content = templateClient
    .replace("{{imports}}", importPaths.join("\n"))
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
    // .replace("<html", "<!DOCTYPE html>\n<html")
    .replace(`{{pwaEnabled}}`, pwaEnabled ? "register()" : "")
    // .replace(`{{pwaEnabled}}`, "")
    .replace(`{{render}}`, renderContent)
    .replace(`NODE_ENV`, `"${process.env.NODE_ENV}"`)
    .replace(`renderStrategy`, `"${renderStrategy}"`);

  if (development) {
    content = content.replace(
      "persei/components/ClientEntry",
      "persei/components/ClientEntryHot"
    );
  }

  if (!existsSync(rumboTempDir)) {
    mkdirSync(rumboTempDir);
  }

  const entryPath = path.join(
    rumboTempDir,
    `rumboClient${formatClassName(route)}.tsx`
  );

  writeFileSync(entryPath, content);

  return { entryPath };
}
