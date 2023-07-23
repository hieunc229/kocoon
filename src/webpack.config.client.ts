import webpack from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { formatClassName } from "./utils";

export type WebpackMode = "none" | "development" | "production";
type Props = {
  mode?: WebpackMode;
  publicPath: string;
  entry: string[];
  route: string
};
export function getWebpackReactConfigs(props: Props) {
  const { mode, entry, route } = props;

  const configs: webpack.Configuration = {
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
              loader: MiniCssExtractPlugin.loader,
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
      new webpack.ProvidePlugin({
        React: "react",
      }),
      new MiniCssExtractPlugin({
        filename: `${formatClassName(route)}.css`,
      }),
    ],
  };
  return configs;
}
