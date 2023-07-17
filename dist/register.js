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
const express_1 = __importDefault(require("express"));
const client_1 = __importDefault(require("./client"));
const server_1 = __importDefault(require("./server"));
const path_1 = __importDefault(require("path"));
function registerHandlers(options) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
        console.clear();
        console.log("Start...");
        const { app, server = true, react, debug = false, } = options;
        let rootPath = ((_a = require.main) === null || _a === void 0 ? void 0 : _a.path) || "src";
        const publicPath = options.publicPath || path_1.default.join(rootPath, "/app/public");
        if (react) {
            let reactConfigs = typeof react === "object"
                ? react
                : { dirPath: `${rootPath}/app/client`, route: "/" };
            yield (0, client_1.default)(Object.assign(Object.assign({ app, debug }, reactConfigs), { publicPath }));
        }
        if (server) {
            let serverConfigs = typeof react === "object"
                ? react
                : { dirPath: `${rootPath}/app/server`, route: "/api" };
            yield (0, server_1.default)(Object.assign({ app, debug }, serverConfigs));
        }
        app.use("/", express_1.default.static(publicPath));
    });
}
exports.default = registerHandlers;
