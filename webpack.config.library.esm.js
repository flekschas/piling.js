const webpack = require('webpack');
const EsmWebpackPlugin = require('@purtuga/esm-webpack-plugin');

module.exports = () => ({
  mode: 'production',
  entry: {
    index: './src/index.js'
  },
  output: {
    path: `${__dirname}/dist`,
    filename: 'piling.esm.js',
    libraryTarget: 'var',
    library: 'pilingJs'
  },
  module: {
    rules: [
      {
        test: /(umap-js|skmeans)/,
        use: ['raw-loader']
      }
    ]
  },
  optimization: {
    minimize: false
  },
  resolve: {
    extensions: ['*', '.js']
  },
  externals: {
    'pixi.js': 'PIXI',
    'umap-js': 'UMAP'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new EsmWebpackPlugin()
  ]
});
