const path = require('path');

module.exports = {
  entry: './src/looker_data_table.js',
  output: {
    filename: 'looker_data_table.js',
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

