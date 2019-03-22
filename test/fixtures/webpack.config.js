const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  output: {
    filename: '[name].[chunkhash].js',
    publicPath: '/public/'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },
  optimization: {
    splitChunks: {
      chunks: 'async',
      name: true,
      cacheGroups: {
        common: {
          minSize: 10,
          name: 'common',
          chunks: 'initial',
          minChunks: 2
        }
      }
    }
    // minimize: false
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css'
    })
  ]
};