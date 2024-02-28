import webpack from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

import { formatClassName } from "./utils/text";
import merge from "webpack-merge";
import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";

type Props = {
  mode?: WebpackMode;
  publicPath: string;
  entry: any;
  route: string;
  distDir: string;
};

export function getWebpackReactConfigs(
  props: Props,
  preConfigs?: webpack.Configuration
): webpack.Configuration {
  let { mode, route, entry, distDir, publicPath } = props;
  const isDevelopment = (mode || process.env.NODE_ENV) === "development";
  const isBuildProduction = process.env.NODE_ENV === "production";

  if (isDevelopment) {
    entry[formatClassName(route)].push(
      "react-hot-loader/patch",
      `webpack-hot-middleware/client?path=${path.join(
        route.replace("*", ""),
        "__webpack_hmr"
      )}`
    );
  }

  let configs: webpack.Configuration = {
    mode,
    name: route,
    entry,
    output: {
      path: path.join(distDir, "static"),
      publicPath: "/static",
      filename: "[name].[fullhash:8].js",
      chunkFilename: "[name].[fullhash:8]-[id].js",
    },
    module: {
      rules: isBuildProduction
        ? []
        : [
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
                  ],
                },
              },
            },
            {
              oneOf: [
                {
                  test: /\.module\.scss$/,
                  use: [
                    !isBuildProduction && MiniCssExtractPlugin.loader,
                    isBuildProduction
                      ? "css-loader"
                      : {
                          loader: "css-loader",
                          options: {
                            modules: true,
                            url: false,
                            sourceMap: false,
                          },
                        },
                    "sass-loader",
                  ],
                  // .filter((loader) => isBuildProduction ? typeof loader === "string" : loader),
                },
                {
                  test: /\.(scss|sass|css)$/i,
                  use: [
                    // "style-loader",
                    {
                      loader: MiniCssExtractPlugin.loader,
                      options: {
                        esModule: false,
                      },
                    },
                    {
                      loader: "css-loader",
                      options: { url: false, sourceMap: false },
                    },
                    "sass-loader",
                    "postcss-loader",
                  ],
                },
              ],
            },
          ],
    },
    resolve: {
      extensions: [".ts", ".js", ".tsx", ".json"],
      modules: ["src", "node_modules"],
    },
    plugins: [
      new webpack.ProvidePlugin({
        React: "react",
      }),
      new MiniCssExtractPlugin({
        filename: `${formatClassName(route)}.css`,
      }),

      new HtmlWebpackPlugin({
        filename: path.join(distDir, route, "index.html"),
        template: path.join(publicPath, "index.html"),
      }),
    ],
    optimization: {
      // usedExports: true,
      // runtimeChunk: "single",
    },
  };

  if (preConfigs) {
    configs = merge(configs, preConfigs);
  }

  if (mode === "production") {
    configs = merge(configs, {
      optimization: {
        minimize: true,
        // minimizer: [new CssMinimizerPlugin()]
      },
    });
  } else {
    // @ts-ignore
    configs.module?.rules[1].oneOf[1].use.splice(0, 0, "style-loader");

    configs = merge(configs, {
      devtool: "cheap-module-source-map",
      plugins: [new webpack.HotModuleReplacementPlugin()],
      resolve: {
        alias: {
          rumbo: __dirname,
        },
      },
    });
  }

  return configs;
}
