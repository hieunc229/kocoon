import webpack from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

import { formatClassName } from "./utils/text";

type Props = {
  mode?: WebpackMode;
  publicPath: string;
  entry: string[];
  route: string;
};

export function getWebpackReactConfigs(props: Props): webpack.Configuration {
  let { mode, entry = [], route } = props;

  if (process.env.NODE_ENV === "development") {
    entry.push(
      "react-hot-loader/patch",
      "webpack-hot-middleware/client"
    );
  }

  let configs: webpack.Configuration = {
    mode,
    entry,
    module: {
      rules: [
        // {
        //   test: /\.(png|svg|jpg|gif|ico)$/i,
        //   type: 'asset',
        // },
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
          test: /\.(scss|sass|css)$/i,
          use: [
            "style-loader",
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                esModule: false,
              },
            },
            {
              loader: "css-loader",
              options: { url: false },
            },
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
      new webpack.ProvidePlugin({
        React: "react",
      }),
      new MiniCssExtractPlugin({
        filename: `${formatClassName(route)}.css`,
      }),
    ],
    optimization: {
      minimize: mode === "production",
      usedExports: true,
      // getServerProps: false
    },
  };

  if (mode === "development") {
    configs.devtool = "inline-source-map";
  }

  return configs;
}
