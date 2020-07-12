const path = require('path');

module.exports = {
  entry: {
    looker_data_table: './src/looker_data_table.js',
    vis_plugin: './src/vis_plugin.js',
    looker_helpers: './src/looker_helpers.js'
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
  }
};

