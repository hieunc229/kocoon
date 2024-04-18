const path = require("path");
const { EsbuildPlugin } = require("esbuild-loader");
const { ProvidePlugin, NormalModuleReplacementPlugin } = require("webpack");

module.exports = {
  mode: "production",
  entry: {
    index: path.join(__dirname, "../build/src/index.js"),
  },
  output: {
    path: path.join(__dirname, "../bundle/server"),
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|gif|css||jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
        type: "asset/resource",
        loader: "file-loader",
      },
      {
        test: /\.node$/,
        loader: "node-loader",
      },
      {
        test: /\.(tsx|ts|js|jsx)?$/,
        use: {
          loader: "esbuild-loader",
          options: {
            jsx: "automatic",
            target: "node18"
          },
        },
      },
      {
        test: /\.(css|scss|sass)$/i,
        use: ["style-loader", "css-loader", "sass-loader", "postcss-loader"],
      },
    ],
  },
  plugins: [
    new ProvidePlugin({
      React: "react",
    }),

    new NormalModuleReplacementPlugin(/([a-z-_0-9]+\.css)/, "noop2"),
  ],
  resolve: {
    extensions: [".ts", ".js", ".tsx", ".json"],
    modules: ["build", "node_modules", "build/src"],
  },
  optimization: {
    minimizer: [new EsbuildPlugin({ target: "node16", css: true, jsx: "automatic", treeShaking: true })],
  },
};
