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
function registerServerHandlers(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { app, dirPath, route, debug = false } = options;
        let paths = [];
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
        yield registerPath("", dirPath);
        paths = paths.sort(sortPath);
        paths.forEach((p, i, list) => {
            let found = list.findIndex((li) => li.handlePath === p.handlePath);
            if (found !== i && list[found].method === p.method) {
                console.log(chalk_1.default.red.bold(`Error: Ambiguous path (${p.handlePath})`), `\n- ${p.filePath}\n- ${list[found].filePath}`);
                process.exit(1);
            }
        });
        for (let p of paths) {
            const pMethod = p.method;
            const pFilePath = p.filePath;
            const pHandlePath = p.handlePath;
            const handlers = yield Promise.resolve(`${pFilePath}`).then(s => __importStar(require(s)));
            if (typeof handlers.default === "function") {
                app[pMethod].apply(app, 
                // @ts-ignore
                [pHandlePath, Object.keys(handlers).map((k) => handlers[k])]);
                debug &&
                    console.log(`[${(pMethod.toUpperCase() + "  ").substring(0, 5)}]`, pHandlePath, pFilePath);
            }
            else {
                console.log(chalk_1.default.redBright(`Invalid handler:\n- (${pMethod}) ${pHandlePath}\n- at ${pFilePath}`));
            }
        }
    });
}
exports.default = registerServerHandlers;
function sortPath(a, b) {
    if (a.handlePath === b.handlePath && a.method === "use") {
        return -1;
    }
    return a.handlePath.localeCompare(b.handlePath);
}
function getRegisterPath(options) {
    const { filePath, routePath } = options;
    let parts = routePath.split(".")[0].split("/");
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
// function getRegisterPath(options: { filePath: string, routePath: string }) {
//   const { filePath, routePath } = options;
//   let [name, ...paths] = routePath.split(".");
//   let method = paths.length === 1 ? "get" : paths[0].toLowerCase();
//   let nameSplits = name.split("/");
//   if (nameSplits.pop() === "_middleware") {
//     method = "use";
//     name = nameSplits.join("/")
//   }
//   const handlePath = name
//     .replace("index", "")
//     .replace(/\[([a-z]+)\]/ig, ":$1");
//   return {
//     handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
//     method,
//     filePath
//   }
// }
