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
require("ignore-styles");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const react_1 = require("react");
const server_1 = require("react-router-dom/server");
const handler_1 = require("./handler");
const bundler_1 = require("./bundler");
const utils_1 = require("./utils");
const generator_1 = require("./generator");
const layoutRegex = /_layout$/i;
function registerClientSSR(props) {
    return __awaiter(this, void 0, void 0, function* () {
        const { app, publicPath, debug = false, distDir, route, rootDir, location, } = props;
        let paths = [];
        debug && console.log(chalk_1.default.green(`[Client SSR]`, route));
        function registerPath(ppath, _path) {
            return __awaiter(this, void 0, void 0, function* () {
                for (let p of fs_1.default.readdirSync(_path)) {
                    const filePath = path_1.default.join(_path, p);
                    const currentRoutePath = path_1.default.join(route, ppath, p);
                    if (fs_1.default.statSync(filePath).isDirectory()) {
                        yield registerPath(currentRoutePath, filePath);
                        continue;
                    }
                    if (filePath.match(/\.(js|ts|tsx|jsx)$/)) {
                        paths.push((0, utils_1.getRegisterPath)({
                            filePath,
                            routePath: currentRoutePath,
                        }));
                    }
                }
            });
        }
        yield registerPath("", location);
        paths = paths.sort(utils_1.sortPath);
        let routes = {};
        for (let p of paths) {
            const pFilePath = p.filePath;
            const pHandlePath = p.handlePath;
            if (pHandlePath === "/_context") {
                continue;
            }
            const handler = require(pFilePath);
            const isLayout = layoutRegex.test(pHandlePath);
            let data = {};
            let rname = pHandlePath;
            if (isLayout) {
                rname = pHandlePath.replace(layoutRegex, "");
                data = {
                    layout: handler,
                    layoutName: p.handlePath.replace(/(\/|:)/g, "_"),
                    layoutPath: p.filePath.replace(/\.(js|ts|tsx)$/g, ""),
                };
            }
            else {
                data = {
                    handler,
                    handlerName: p.handlePath.replace(/(\/|:)/g, "_"),
                    handlerPath: p.filePath.replace(/\.(js|ts|tsx)$/g, ""),
                };
            }
            routes[rname] = Object.assign({}, routes[rname], data);
        }
        const staticRoutes = Object.entries(routes).map(([route, { layout, handler }]) => {
            if (layout) {
                return {
                    path: route,
                    element: (0, react_1.createElement)(layout.default, null, (0, react_1.createElement)(handler.default)),
                };
            }
            return {
                path: route,
                Component: handler.default,
            };
        });
        const staticHandler = (0, server_1.createStaticHandler)(staticRoutes);
        const AppComponent = yield (0, generator_1.getAppComponent)({ rootDir, publicPath });
        // register paths
        Object.entries(routes).forEach(([r, props]) => {
            app.get(r, (0, handler_1.clientHandler)(props, {
                staticRoutes,
                staticHandler,
                AppComponent,
                route: r,
            }));
            debug && console.log(chalk_1.default.gray(`-`, r));
        });
        yield (0, bundler_1.bundleClientSSR)({ entries: paths, publicPath, routes, route, distDir });
    });
}
exports.default = registerClientSSR;
