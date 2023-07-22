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
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const webpack_1 = __importDefault(require("webpack"));
const html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
const webpack_config_client_1 = require("../webpack.config.client");
function registerClientSPA(props) {
    return __awaiter(this, void 0, void 0, function* () {
        const { app, publicPath = "./public", location, distDir, route, debug } = props;
        app.get(`${route}*`, function (_, res) {
            res.sendFile(path_1.default.join(distDir, route, "index.html"));
        });
        const entryPath = path_1.default.join(location, "index.tsx");
        let dfConfigs = {};
        const clientConfigPath = path_1.default.join(process.cwd(), "webpack.config.client");
        try {
            dfConfigs = require(clientConfigPath).default || {};
        }
        catch (e) {
            // no client config
        }
        let mode = process.env.NODE_ENV || "development";
        const clientConfigs = (0, webpack_config_client_1.getWebpackReactConfigs)({
            mode,
            publicPath,
            entry: [entryPath],
            route,
        });
        const configs = Object.assign({}, dfConfigs, clientConfigs, {
            mode,
            output: {
                path: distDir,
                filename: "[name].js",
                publicPath: "/",
            },
            plugins: [
                new html_webpack_plugin_1.default({
                    template: path_1.default.join(publicPath, "index.html"),
                }),
                ...(clientConfigs.plugins || []),
            ],
        });
        debug && console.log(chalk_1.default.green(`[Client SSR]`, route));
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
                if (stats === null || stats === void 0 ? void 0 : stats.compilation.warnings.length) {
                    console.log(chalk_1.default.gray("Packing completed with warnings"));
                    stats === null || stats === void 0 ? void 0 : stats.compilation.warnings.forEach((err) => {
                        console.log(chalk_1.default.red("- ", err.message));
                    });
                    return acept({});
                }
                console.log(chalk_1.default.gray(`- Pack SPA client ${route} completed`));
                acept({});
            });
        });
    });
}
exports.default = registerClientSPA;
