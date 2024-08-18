import path from "path";
import webpack from "webpack";
import merge from "webpack-merge";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

import { formatClassName } from "./utils/text";
import { EsbuildPlugin } from "esbuild-loader";

type Props = {
  mode?: WebpackMode;
  publicPath: string;
  entry: any;
  route: string;
  distDir: string;
  pwaEnabled?: boolean;
};

export function getWebpackReactConfigs(
  props: Props,
  preConfigs?: webpack.Configuration
): webpack.Configuration {
  let { mode, route, entry, distDir, publicPath, pwaEnabled } = props;
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
      path: path.join(distDir, "static/"),
      publicPath: "/static/",
      filename: "[name].[fullhash:8].js",
      chunkFilename: "[name].[fullhash:8]-[id].js",
      hotUpdateChunkFilename: "[id].[fullhash].hot-update.js",
      hotUpdateMainFilename: "[runtime].[fullhash].hot-update.json",
    },
    module: {
      rules: [
        {
          test: /\.(tsx|ts|js|jsx)?$/,
          exclude: /node_modules/,
          use: {
            loader: "esbuild-loader",
            options: {
              jsx: "automatic",
            },
          },
        },
        {
          oneOf: [
            {
              test: /\.module\.scss$/,
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
                      options: {
                        modules: true,
                        url: false,
                        sourceMap: false,
                      },
                    },
                "postcss-loader",
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
        filename: "[name].[fullhash:8].css",
        chunkFilename: "[name].[fullhash:8]-[id].css",
      }),

      new HtmlWebpackPlugin({
        filename: "index.html",
        minify: !isDevelopment,
        publicPath: route.replace(/\*/g, ""),
      }),
    ],
  };

  if (preConfigs) {
    configs = merge(configs, preConfigs);
  }

  if (isDevelopment) {
    configs = merge(configs, {
      devtool: "source-map",
      plugins: [new webpack.HotModuleReplacementPlugin()],
      optimization: {
        runtimeChunk: true,
      },
      resolve: {
        alias: {
          "react-dom": "@hot-loader/react-dom",
        },
      },
    });
  } else {
    configs = merge(configs, {
      mode: "production",
      devtool: false,
      optimization: {
        minimize: true,
        minimizer: [new EsbuildPlugin({ target: "es2021" })],
        splitChunks: {
          chunks: "all",
        },
      },
      plugins: [
        new webpack.DefinePlugin({
          "process.env.NODE_ENV": `"production"`,
        }),
      ],
    });
  }

  return configs;
}
