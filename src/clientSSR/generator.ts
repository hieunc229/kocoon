import fs from "fs";
import path from "path";
import chalk from "chalk";
import templateEntry from "../templates/entry.tpl";

import { rumboTempDir } from "../configs";
import { formatClassName } from "../utils/text";

export default function generateApp(props: {
  publicPath: string;
  componentPath?: string;
  templatePath?: string;
  route: string;
  debug: boolean;
  pwaEnabled?: boolean;
}) {
  const { publicPath, templatePath, componentPath, route, debug } =
    props;

  const htmlTemplate = fs.readFileSync(
    templatePath || `${publicPath}/index.html`,
    {
      encoding: "utf-8",
    }
  );

  const appClassContent = templateEntry.replace(
    "{{content}}",
    htmlTemplate
      .replace(
        `<div id="root"></div>`,
        `<div id="root">{children}</div><div id="ssr-data" style={{ display: "none" }}>{JSON.stringify({data,settings,globalData,session,routeProps})}</div>`
      )
      .replace("<meta charset=", "<meta charSet=")
      // fix link doesn't have closing tag
      .replace(`rel="stylesheet"></head>`, `rel="stylesheet"/></head>`)
      .replace(
        "</head>",
        // `<link href="/static/_.css" rel="stylesheet" /></head>`
        [
          `<link href="/static/${formatClassName(route)}.css" rel="stylesheet" />`,
          // pwaEnabled ? `<link rel="manifest" href="/manifest.json" />`: false,
          `</head>`,
        ]
          .filter(Boolean)
          .join("")
      )
      // .replace("<head>", `<head><HelmetContent />`)
      .replace(
        "<head>",
        `<head>{helmet.title.toComponent()}
      {helmet.meta.toComponent()}
      {helmet.link.toComponent()}`
      )
    // .replace("</body>", `<script src="/static/${formatClassName(route)}.js"></script></body>`)
  );

  const appClassPath = componentPath || path.join(rumboTempDir, "rumboApp.tsx");

  if (!fs.existsSync(rumboTempDir)) {
    fs.mkdirSync(rumboTempDir);
    debug && console.log(chalk.gray("...create", rumboTempDir));
  }

  fs.writeFileSync(appClassPath, appClassContent);

  return { appClassPath, htmlTemplate };
}

//
export function getAppComponent(props: {
  rootDir: string;
  publicPath: string;
  templatePath?: string;
  route: string;
  debug: boolean;
  pwaEnabled?: boolean;
}) {
  const { rootDir, route } = props;

  const componentPath = path.join(
    rootDir,
    "..",
    rumboTempDir,
    `rumboEntry${formatClassName(route)}.tsx`
  );

  if (!fs.existsSync(componentPath)) {
    generateApp({
      ...props,
      componentPath,
    });
  }

  // props.debug && console.log(`staticImports ssr.generate(missing) ${route}: ${componentPath}`);

  return require(componentPath);
}
