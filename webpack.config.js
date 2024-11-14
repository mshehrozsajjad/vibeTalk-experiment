const path = require("path");
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: "./src/renderer/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "out"),
  },
  experiments: {
    topLevelAwait: true,
  },
  externals: [
    nodeExternals({
      modulesDir: path.join(__dirname, 'node_modules'),
      importType: 'commonjs',
      allowlist: ['svelte', /^svelte\//],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.svelte$/,
        exclude: /node_modules/,
        use: {
          loader: "svelte-loader",
          options: {
            compilerOptions: {
              dev: process.env.NODE_ENV === "development",
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
      }
    ],
  },
  resolve: {
    alias: {
      svelte: path.resolve("node_modules", "svelte/src/runtime"),
    },
    extensions: [".mjs", ".js", ".svelte"],
    mainFields: ["svelte", "browser", "module", "main"],
    conditionNames: ["svelte", "browser", "module", "main"],
  },
};
