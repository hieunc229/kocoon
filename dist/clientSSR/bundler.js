"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundleClientSSR = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const webpack_1 = __importDefault(require("webpack"));
const webpack_config_client_1 = require("../webpack.config.client");
const configs_1 = require("../configs");
function bundleClientSSR(props) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { publicPath = "./public", routes, route, distDir } = props;
        const entries = props.entries.map((e) => (Object.assign(Object.assign({}, e), { name: e.handlePath.replace(/(\/|:)/g, "_"), filePath: e.filePath.replace(/\.(js|ts|tsx)$/g, "") })));
        const templateEntry = fs_1.default.readFileSync(path_1.default.join(__dirname, "./templateClient.tpl"), {
            encoding: "utf-8",
        });
        const content = templateEntry
            .replace("{{imports}}", entries
            .map((item) => `import ${item.name} from "${item.filePath}"`)
            .join("\n"))
            .replace(/{{htmlComponent}}/g, "<RouterProvider router={router} />")
            .replace("{{routes}}", Object.entries(routes)
            .map(([path, r]) => {
            if (r.layoutName) {
                return `{path:"${path}",element:createElement(${r.layoutName},null,createElement(${r.handlerName}))}`;
            }
            return `{path:"${path}",Component:${r.handlerName}}`;
        })
            .join(","));
        const entryPath = path_1.default.join(configs_1.rumboTempDir, "rumboClient.tsx");
        fs_1.default.writeFileSync(entryPath, content);
        // @ts-ignore
        let dfConfigs = {};
        const clientConfigPath = path_1.default.join(process.cwd(), "webpack.config.client");
        try {
            dfConfigs = (require(clientConfigPath)).default || {};
        }
        catch (e) {
            // no client config
        }
        let mode = process.env.NODE_ENV || "development";
        const clientConfigs = (0, webpack_config_client_1.getWebpackReactConfigs)({
            mode,
            publicPath,
            entry: [`./${entryPath}`],
            route,
        });
        const configs = Object.assign({}, dfConfigs, clientConfigs, {
            mode,
            output: {
                path: distDir,
                publicPath: "/",
                filename: `${route.replace(/\//, "_")}.js`,
            },
            resolve: Object.assign(Object.assign({}, clientConfigs.resolve), { alias: Object.assign(Object.assign({}, (_a = clientConfigs.resolve) === null || _a === void 0 ? void 0 : _a.alias), { rumbo: path_1.default.resolve(__dirname, "..") }) }),
        });
        const compiler = (0, webpack_1.default)(configs);
        return new Promise((acept, reject) => {
            compiler.run((err, stats) => {
                if (err) {
                    console.log(chalk_1.default.red("Packing error", err.toString()));
                    return reject(err);
                }
                if (stats === null || stats === void 0 ? void 0 : stats.compilation.errors.length) {
                    console.log(chalk_1.default.red("Packing error"));
                    stats === null || stats === void 0 ? void 0 : stats.compilation.errors.forEach((err) => {
                        console.log(chalk_1.default.red("- ", err.message));
                    });
                    return reject(`Failed`);
                }
                console.log(chalk_1.default.gray(`- Packing SSR client ${route} completed`));
                acept({});
            });
        });
    });
}
exports.bundleClientSSR = bundleClientSSR;
