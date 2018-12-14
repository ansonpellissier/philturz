const webpack = require('webpack');
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './philturz.js',
  output: {
    path: path.resolve(__dirname),
    filename: 'philturz.min.js',
    libraryTarget: 'umd',
    library: 'philturz'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  }
};