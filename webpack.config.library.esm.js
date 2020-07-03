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
      },
      {
        test: /\.(js|fs|vs)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
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
    'pixi.js': {
      commonjs: 'pixi.js',
      commonjs2: 'pixi.js',
      amd: 'pixi.js',
      root: 'PIXI'
    },
    'umap-js': {
      commonjs: 'umap-js',
      commonjs2: 'umap-js',
      amd: 'umap-js',
      root: 'UMAP'
    }
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
