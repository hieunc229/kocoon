"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebpackReactConfigs = void 0;
const webpack_1 = __importDefault(require("webpack"));
const mini_css_extract_plugin_1 = __importDefault(require("mini-css-extract-plugin"));
function getWebpackReactConfigs(props) {
    const { mode, entry, route } = props;
    const configs = {
        mode,
        entry,
        module: {
            rules: [
                {
                    test: /\.(tsx|ts|js|jsx)?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                "@babel/preset-react",
                                "@babel/preset-typescript",
                                "@babel/preset-env",
                                "@babel/preset-flow",
                            ]
                        },
                    },
                },
                {
                    test: /\.(scss|sass|css)$/i,
                    use: [
                        "style-loader",
                        {
                            loader: mini_css_extract_plugin_1.default.loader,
                            options: {
                                esModule: false,
                            },
                        },
                        "css-loader",
                        "sass-loader",
                        "postcss-loader",
                    ],
                },
            ],
        },
        resolve: {
            extensions: [".ts", ".js", ".tsx"],
        },
        plugins: [
            new webpack_1.default.ProvidePlugin({
                React: "react",
            }),
            new mini_css_extract_plugin_1.default({
                filename: '[name].css' //`${route.replace(/\//g, "_")}.css`,
            }),
        ],
    };
    return configs;
}
exports.getWebpackReactConfigs = getWebpackReactConfigs;
