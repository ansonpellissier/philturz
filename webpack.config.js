const webpack = require('webpack');
const path = require('path');
const package = require('./package.json');

module.exports = {
  mode: 'production',
  entry: './philturz.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: `philturz-${package.version}.min.js`,
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