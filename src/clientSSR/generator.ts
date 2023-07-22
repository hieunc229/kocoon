import fs from "fs";
import path from "path";
import { rumboTempDir } from "../configs";

export function generateApp(props: {
  publicPath: string;
  componentPath?: string;
  templatePath?: string;
}) {
  const { publicPath, templatePath, componentPath } = props;

  const htmlTemplate = fs.readFileSync(
    templatePath || `${publicPath}/index.html`,
    {
      encoding: "utf-8",
    }
  );

  const appTemplate = fs.readFileSync(
    path.join(__dirname, "./templateApp.tpl"),
    {
      encoding: "utf-8",
    }
  );

  const appClassContent = appTemplate.replace(
    "{{content}}",
    htmlTemplate
      .replace(
        `<div id="root"></div>`,
        `<div id="root">{children}</div><div id="ssr-data" style={{ display: "none" }}>{JSON.stringify(data)}</div>`
      )
      .replace("<meta charset=", "<meta charSet=")
      // fix link doesn't have closing tag
      .replace(`rel="stylesheet"></head>`, `rel="stylesheet"/></head>`)
      .replace("</head>", `<link href="/main.css" rel="stylesheet" /></head>`)
  );

  const appClassPath = componentPath || path.join(rumboTempDir, "rumboApp.tsx");
  fs.writeFileSync(appClassPath, appClassContent);

  return { appClassPath, htmlTemplate };
}

//
export function getAppComponent(props: {
  rootDir: string;
  publicPath: string;
  templatePath?: string;
}) {
  const { rootDir } = props;

  const componentPath = path.join(rootDir, "..", rumboTempDir, "rumboApp.tsx");

  if (!fs.existsSync(componentPath)) {
    generateApp({
      ...props,
      componentPath,
    });
  }

  return require(componentPath).default;
}
