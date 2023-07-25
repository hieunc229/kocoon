import webpack from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { formatClassName } from "./utils/text";

export type WebpackMode = "none" | "development" | "production";
type Props = {
  mode?: WebpackMode;
  publicPath: string;
  entry: string[];
  route: string;
};
export function getWebpackReactConfigs(props: Props): webpack.Configuration {
  const { mode, entry, route } = props;

  const configs: webpack.Configuration = {
    mode,
    // devtool: mode === "development" ? "#source-map" : false,
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
      usedExports: true,
      // getServerProps: false
    },
  };
  return configs;
}
