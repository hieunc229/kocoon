const path = require("path");
// const webpack = require("webpack");

module.exports = {
  target: "node",
  mode: "production",
  // externals: [nodeExternals()], // removes node_modules from your final bundle
  entry: path.join(__dirname, "../build/src/index.js"),
  output: {
    path: path.join(__dirname, "../bundle/server"), // this can be any path and directory you want
    filename: "index.js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|gif|css|ico)$/,
        type: "asset/resource",
        // exclude: "./src/app"
      },
      {
        test: /\.node$/,
        loader: "node-loader",
      },
      {
        test: /\.(tsx|ts|js|jsx)?$/,
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
      // {
      //   test: /\.(scss|sass|css)$/i,
      //   use: ["style-loader", "css-loader", "sass-loader", "postcss-loader"],
      // },
    ],
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx"],
  },
  optimization: {
    minimize: false, //"compress",
  },
};
