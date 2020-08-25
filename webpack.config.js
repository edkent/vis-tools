const path = require('path');

module.exports = {
  entry: {
    vis_table_plugin: './src/vis_table_plugin.js',
    vis_plugin: './src/vis_plugin.js',
    vis_primitives: './src/vis_primitives.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname),
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      }
    ]
  },
  optimization: {
    minimize: false
  }
};
