import fs from "fs";
import path from "path";
import chalk from "chalk";
import { rumboTempDir } from "../configs";
import { formatClassName } from "../utils/text";

export default function generateApp(props: {
  publicPath: string;
  componentPath?: string;
  templatePath?: string;
  route: string;
  debug: boolean;
}) {
  const { publicPath, templatePath, componentPath, route, debug } = props;

  const htmlTemplate = fs.readFileSync(
    templatePath || `${publicPath}/index.html`,
    {
      encoding: "utf-8",
    }
  );

  const appTemplate = fs.readFileSync(
    path.join(__dirname, "../templates/templateEntry.tpl"),
    {
      encoding: "utf-8",
    }
  );

  const appClassContent = appTemplate.replace(
    "{{content}}",
    htmlTemplate
      .replace(
        `<div id="root"></div>`,
        `<div id="root">{children}</div><div id="ssr-data" style={{ display: "none" }}>{JSON.stringify({data,settings})}</div>`
      )
      .replace("<meta charset=", "<meta charSet=")
      // fix link doesn't have closing tag
      .replace(`rel="stylesheet"></head>`, `rel="stylesheet"/></head>`)
      .replace(
        "</head>",
        `<link href="/static/${formatClassName(
          route
        )}.css" rel="stylesheet" /></head>`
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
}) {
  const { rootDir, route } = props;

  const componentPath = path.join(
    rootDir,
    "..",
    rumboTempDir,
    `clientEntry${formatClassName(route)}.tsx`
  );

  if (!fs.existsSync(componentPath)) {
    generateApp({
      ...props,
      componentPath,
    });
  }

  // debug && console.log(`staticImports ssr.generate(missing) ${componentPath}`);

  return require(componentPath);
}
