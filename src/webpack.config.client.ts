import path from "path";
import webpack from "webpack";
import merge from "webpack-merge";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import OptimizeCSSAssetsPlugin from "optimize-css-assets-webpack-plugin";

import { formatClassName } from "./utils/text";

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
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";

  // let entry = props.entry[formatClassName(route)];
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
      // sourceMapFilename: "[name].[fullhash:8].map",
      chunkFilename: "[name].[fullhash:8]-[id].js",
    },
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
              ],
            },
          },
        },
        {
          oneOf: [
            {
              test: /\.module\.scss$/,
              use: [
                // MiniCssExtractPlugin.loader,
                isProduction
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
            },
            {
              test: /\.(scss|sass|css)$/i,
              use: [
                isProduction
                  ? "style-loader"
                  : {
                      loader: MiniCssExtractPlugin.loader,
                      options: {
                        esModule: false,
                      },
                    },
                isProduction
                  ? "css-loader"
                  : {
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

  if (isProduction) {
    configs = merge(configs, {
      mode: "production",
      devtool: false,
      optimization: {
        minimize: true,
      },
      plugins: [
        new webpack.DefinePlugin({
          "process.env.NODE_ENV": "production",
        }),
      ],
    });
  } else if (isDevelopment) {
    configs = merge(configs, {
      devtool: "cheap-module-source-map",
      plugins: [new webpack.HotModuleReplacementPlugin()],
      resolve: {
        alias: {
          "rumbo/components/ClientEntry": "rumbo/components/ClientEntryHot",
        },
      },
    });
  } else {
    // BUILD
    configs = merge(configs, {
      optimization: {
        minimizer: [new OptimizeCSSAssetsPlugin({})]
      }
    })
  }

  return configs;
}
