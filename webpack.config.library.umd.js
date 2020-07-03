const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const UnminifiedWebpackPlugin = require('unminified-webpack-plugin');

module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  entry: {
    index: './src/index.js'
  },
  output: {
    path: `${__dirname}/dist`,
    filename: argv.mode === 'production' ? 'piling.min.js' : 'piling.js',
    libraryTarget: 'umd',
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
    minimize: argv.mode === 'production',
    minimizer: [
      new TerserPlugin({
        include: /\.min\.js$/
      })
    ]
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
    new UnminifiedWebpackPlugin()
  ]
});
