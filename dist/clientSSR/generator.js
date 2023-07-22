"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppComponent = exports.generateApp = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const configs_1 = require("../configs");
function generateApp(props) {
    const { publicPath, templatePath, componentPath } = props;
    const htmlTemplate = fs_1.default.readFileSync(templatePath || `${publicPath}/index.html`, {
        encoding: "utf-8",
    });
    const appTemplate = fs_1.default.readFileSync(path_1.default.join(__dirname, "./templateApp.tpl"), {
        encoding: "utf-8",
    });
    const appClassContent = appTemplate.replace("{{content}}", htmlTemplate
        .replace(`<div id="root"></div>`, `<div id="root">{children}</div><div id="ssr-data" style={{ display: "none" }}>{JSON.stringify(data)}</div>`)
        .replace("<meta charset=", "<meta charSet=")
        // fix link doesn't have closing tag
        .replace(`rel="stylesheet"></head>`, `rel="stylesheet"/></head>`)
        .replace("</head>", `<link href="/main.css" rel="stylesheet" /></head>`));
    const appClassPath = componentPath || path_1.default.join(configs_1.rumboTempDir, "rumboApp.tsx");
    fs_1.default.writeFileSync(appClassPath, appClassContent);
    return { appClassPath, htmlTemplate };
}
exports.generateApp = generateApp;
//
function getAppComponent(props) {
    const { rootDir } = props;
    const componentPath = path_1.default.join(rootDir, "..", configs_1.rumboTempDir, "rumboApp.tsx");
    if (!fs_1.default.existsSync(componentPath)) {
        generateApp(Object.assign(Object.assign({}, props), { componentPath }));
    }
    return require(componentPath).default;
}
exports.getAppComponent = getAppComponent;
