const path = require("path");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: "production", // this trigger webpack out-of-box prod optimizations
  entry: "./index.js",
  output: {
    filename: `bookmarklet.js`, // [hash] is useful for cache busting!
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),

  ],
  devtool: "source-map" // supposedly the ideal type without bloating bundle size
};