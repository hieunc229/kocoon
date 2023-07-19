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
exports.bundleClient = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const webpack_1 = __importDefault(require("webpack"));
function bundleClient(props) {
    return __awaiter(this, void 0, void 0, function* () {
        const { publicPath = "./public", routes } = props;
        const entries = props.entries.map((e) => (Object.assign(Object.assign({}, e), { name: e.handlePath.replace(/(\/|:)/g, "_"), filePath: e.filePath.replace(/\.(js|ts|tsx)$/g, "") })));
        const htmlTemplate = fs_1.default.readFileSync(`${publicPath}/index.html`, {
            encoding: "utf-8",
        });
        const appTemplate = fs_1.default.readFileSync(path_1.default.join(__dirname, "../appTemplate.tpl"), {
            encoding: "utf-8",
        });
        const content = appTemplate
            .replace("{{imports}}", entries
            .map((item) => `import ${item.name} from "${item.filePath}"`)
            .join("\n"))
            .replace(/{{htmlComponent}}/g, htmlTemplate.replace("{{content}}", "<RouterProvider router={router} />"))
            .replace("{{routes}}", Object.entries(routes)
            .map(([path, r]) => {
            if (r.layoutName) {
                return `{path:"${path}",element:createElement(${r.layoutName},null,createElement(${r.handlerName}))}`;
            }
            return `{path:"${path}",Component:${r.handlerName}}`;
        })
            .join(","));
        const tempDir = "./.reroute";
        if (!fs_1.default.existsSync(tempDir)) {
            fs_1.default.mkdirSync(tempDir);
        }
        const entryPath = path_1.default.join(tempDir, "tempEntry.tsx");
        fs_1.default.writeFileSync(entryPath, content);
        // @ts-ignore
        let dfConfigs = {};
        const clientConfigPath = path_1.default.join(process.cwd(), "webpack.config.client");
        try {
            dfConfigs = (yield Promise.resolve(`${clientConfigPath}`).then(s => __importStar(require(s)))).default || {};
        }
        catch (e) {
            // no client config
        }
        const configs = Object.assign({}, dfConfigs, {
            mode: "development",
            entry: [`./${entryPath}`, ...entries.map((item) => item.filePath)],
            output: {
                path: publicPath,
                filename: "bundle.js",
            },
            module: {
                rules: [
                    {
                        test: /\.(tsx|ts)?$/,
                        use: "ts-loader",
                        exclude: /node_modules/,
                    },
                ],
            },
        });
        const compiler = (0, webpack_1.default)(configs);
        compiler.run((err) => {
            if (err) {
                console.log(chalk_1.default.red("Pack Error", err.toString()));
                return;
            }
            console.log(chalk_1.default.green("Packing completed"));
        });
    });
}
exports.bundleClient = bundleClient;
