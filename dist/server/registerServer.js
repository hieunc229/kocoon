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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
function registerServer(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { app, location, route, debug = false } = options;
        let paths = [];
        debug && console.log(chalk_1.default.green(`[Server]`, route));
        function registerPath(ppath, _path) {
            return __awaiter(this, void 0, void 0, function* () {
                for (let p of fs_1.default.readdirSync(_path)) {
                    const filePath = path_1.default.join(_path, p);
                    const currentRoutePath = path_1.default.join(route, ppath, p);
                    if (fs_1.default.statSync(filePath).isDirectory()) {
                        yield registerPath(path_1.default.join(ppath, p), filePath);
                        continue;
                    }
                    paths.push(getRegisterPath({
                        filePath,
                        routePath: currentRoutePath,
                    }));
                }
            });
        }
        yield registerPath("", location);
        paths = paths.sort(sortPath);
        paths.forEach((p, i, list) => {
            var _a, _b;
            let found = list.findIndex((li) => li.handlePath === p.handlePath);
            if (found !== i && ((_a = list[found]) === null || _a === void 0 ? void 0 : _a.method) === p.method) {
                console.log(chalk_1.default.red.bold(`Error: Ambiguous path (${p.handlePath})`), `\n- ${p.filePath}\n- ${(_b = list[found]) === null || _b === void 0 ? void 0 : _b.filePath}`);
                process.exit(1);
            }
        });
        for (let p of paths) {
            const pMethod = p.method;
            const pFilePath = p.filePath;
            const pHandlePath = p.handlePath;
            const handlers = require(pFilePath);
            if (typeof handlers.default === "function") {
                app[pMethod].apply(app, 
                // @ts-ignore
                [pHandlePath, Object.keys(handlers).map((k) => handlers[k])]);
                debug &&
                    console.log(chalk_1.default.gray(`- (${pMethod})`, pHandlePath, pFilePath));
            }
            else {
                console.log(chalk_1.default.redBright(`Invalid handler:\n- (${pMethod}) ${pHandlePath}\n- at ${pFilePath}`));
                process.exit();
            }
        }
        console.log(chalk_1.default.gray(`- Server routes initiated`));
    });
}
exports.default = registerServer;
function sortPath(a, b) {
    if (a.handlePath === b.handlePath && a.method === "use") {
        return -1;
    }
    return a.handlePath.localeCompare(b.handlePath);
}
function getRegisterPath(options) {
    const { filePath, routePath } = options;
    let parts = (routePath.split(".").shift() || "").split("/");
    let method = parts.pop();
    const name = parts.join("/");
    if (!method || method === "index") {
        method = "get";
    }
    else if (method === "_middleware") {
        method = "use";
    }
    const handlePath = name.replace("index", "").replace(/\[([a-z]+)\]/gi, ":$1");
    return {
        handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
        method,
        filePath,
    };
}
