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
const fs_extra_1 = __importDefault(require("fs-extra"));
const express_1 = __importDefault(require("express"));
const registerServer_1 = __importDefault(require("./server/registerServer"));
const registerClientSSR_1 = __importDefault(require("./clientSSR/registerClientSSR"));
const registerClientSPA_1 = __importDefault(require("./clientSPA/registerClientSPA"));
function Rumbo(options) {
    return __awaiter(this, void 0, void 0, function* () {
        process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
        console.clear();
        console.log(chalk_1.default.gray("Rumbo is starting..."));
        const { app, rootDir = __dirname || "src", debug = false, publicDir, listen, routes, } = options;
        const publicPath = publicDir || path_1.default.join(rootDir, "../public");
        const distDir = options.distDir || path_1.default.join(rootDir, "../dist");
        const apps = Object.entries(routes)
            .map(([route, props]) => (Object.assign(Object.assign({}, props), { route })))
            .sort((a, b) => b.route.length - a.route.length);
        if (distDir !== publicPath) {
            fs_extra_1.default.copySync(publicPath, distDir);
        }
        app.use("/", express_1.default.static(distDir));
        for (const client of apps) {
            switch (client.type) {
                case "server":
                    yield (0, registerServer_1.default)(Object.assign({ app, debug }, client));
                    break;
                case "client-spa":
                    yield (0, registerClientSPA_1.default)(Object.assign({ app, debug, publicPath, distDir }, client));
                    break;
                case "client-ssr":
                    yield (0, registerClientSSR_1.default)(Object.assign({ app,
                        debug,
                        publicPath,
                        distDir,
                        rootDir }, client));
                    break;
                case "static":
                    app.use(client.route, express_1.default.static(client.location));
                    break;
            }
        }
        let { host, port } = Object.assign({ host: "localhost", port: 3000 }, typeof listen === "object" ? listen : {});
        app.listen(port, host, () => {
            console.log(chalk_1.default.green(`Server available on ${host}:${port}`));
        });
    });
}
exports.default = Rumbo;
