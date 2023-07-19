"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const react_1 = require("react");
const server_1 = require("react-router-dom/server");
const bundle_1 = require("./bundle");
const handler_1 = require("./handler");
const layoutRegex = /_layout$/i;
function registerClient(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { app, dirPath, route, publicPath, debug = false } = options;
        let paths = [];
        function registerPath(ppath, _path) {
            return __awaiter(this, void 0, void 0, function* () {
                for (let p of fs_1.default.readdirSync(_path)) {
                    const filePath = path_1.default.join(_path, p);
                    const currentRoutePath = path_1.default.join(route, ppath, p);
                    if (fs_1.default.statSync(filePath).isDirectory()) {
                        yield registerPath(currentRoutePath, filePath);
                        continue;
                    }
                    paths.push(getRegisterPath({
                        filePath,
                        routePath: currentRoutePath,
                    }));
                }
            });
        }
        yield registerPath("", dirPath);
        paths = paths.sort(sortPath);
        let routes = {};
        for (let p of paths) {
            const pFilePath = p.filePath;
            const pHandlePath = p.handlePath;
            if (pHandlePath === "/_context") {
                continue;
            }
            debug && console.log(chalk_1.default.gray("Register", pFilePath));
            const handler = yield Promise.resolve(`${pFilePath}`).then(s => __importStar(require(s)));
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
        let staticRoutes = Object.entries(routes).map(([path, { layout, handler }]) => {
            if (layout) {
                return {
                    path,
                    element: (0, react_1.createElement)(layout.default, null, (0, react_1.createElement)(handler.default)),
                };
            }
            return {
                path,
                Component: handler.default,
            };
        });
        let staticHandler = (0, server_1.createStaticHandler)(staticRoutes);
        // register paths
        Object.entries(routes).forEach(([path, props]) => {
            app.get(path, (0, handler_1.clientHandler)(props, { staticRoutes, staticHandler }));
            debug && console.log(chalk_1.default.green(`[Client]`, path));
        });
        yield (0, bundle_1.bundleClient)({ entries: paths, publicPath, routes });
    });
}
exports.default = registerClient;
function sortPath(a, b) {
    return a.handlePath.localeCompare(b.handlePath);
}
function getRegisterPath(options) {
    const { filePath, routePath } = options;
    let [name] = routePath.split(".");
    const handlePath = name.replace("index", "").replace(/\[([a-z]+)\]/gi, ":$1");
    return {
        handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
        filePath,
    };
}
