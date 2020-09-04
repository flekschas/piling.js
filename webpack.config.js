const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineCssWebpackPlugin = require('html-inline-css-webpack-plugin')
  .default;
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => ({
  entry: {
    index: './examples/index.js',
  },
  output: {
    path: `${__dirname}/examples-build`,
    publicPath: argv.mode === 'production' ? './' : '/',
  },
  devServer: {
    contentBase: './examples',
  },
  devtool: 'eval-cheap-source-map',
  module: {
    rules: [
      {
        test: /(umap-js|skmeans)/,
        use: ['raw-loader'],
      },
      {
        test: /\.(js|fs|vs)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['*', '.js'],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      template: 'examples/index.html',
      filename: 'index.html',
      chunks: ['index'],
      inlineSource: /\.css$/i,
    }),
    new HtmlInlineCssWebpackPlugin(),
  ],
});
