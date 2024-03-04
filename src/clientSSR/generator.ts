import fs from "fs";
import path from "path";
import chalk from "chalk";
import templateEntry from "../templates/entry.tpl";

import { rumboTempDir } from "../configs";

export default function generateApp(props: {
  publicPath: string;
  componentPath?: string;
  templatePath?: string;
  route: string;
  debug: boolean;
  pwaEnabled?: boolean;
}) {
  const { publicPath, templatePath, componentPath, debug } = props;

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
      // // uncomment when using entry for each route
      // .replace(
      //   "</head>",
      //   // `<link href="/static/_.css" rel="stylesheet" /></head>`
      //   [
      //     `<link href="/static/${formatClassName(route)}.css" rel="stylesheet" />`,
      //     // pwaEnabled ? `<link rel="manifest" href="/manifest.json" />`: false,
      //     `</head>`,
      //   ]
      //     .filter(Boolean)
      //     .join("")
      // )
      .replace(
        "</head>",
        `{assets
        .filter((path: string) => path.endsWith(".css"))
        .map((path: string) => (
          <link key={\`style-\${path}\`} rel="stylesheet" href={path} />
        ))}</head>`
      )
      // .replace(
      //   "</body>",
      //   `{assets
      //   .filter((path: string) => path.endsWith(".js"))
      //   .map((path: string) => (
      //     <script
      //       key={\`script-\${path}\`}
      //       src={path}
      //     ></script>
      //   ))}</body>`
      // )
      .replace(
        "</head>",
        `{helmet.title.toComponent()}
      {helmet.meta.toComponent()}
      {helmet.link.toComponent()}</head>`
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
export function getAppEntry(props: {
  rootDir: string;
  publicPath: string;
  templatePath?: string;
  route: string;
  debug: boolean;
  pwaEnabled?: boolean;
}) {
  const { rootDir } = props;

  const componentPath = path.join(
    rootDir,
    "..",
    rumboTempDir,
    // // uncomment when using entry for each route
    // `rumboEntry${formatClassName(route)}.tsx`
    `rumboEntry.tsx`
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
