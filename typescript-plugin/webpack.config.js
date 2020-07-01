const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/plugin.ts',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'plugin.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: './[resource-path]',
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
};
