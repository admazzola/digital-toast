const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const CopyPlugin = require("copy-webpack-plugin");

module.exports = {

  // https://webpack.js.org/concepts/entry-points/#multi-page-application
  entry: {
    index: './src/index.js'
  },

  // https://webpack.js.org/configuration/dev-server/
  devServer: {
    port: 8080
  },

    module: {
      rules: [
          {
              test: /\.js$/,
              exclude: /node_modules/,
              loader: 'babel-loader',
              options: {
                  presets: ['@babel/preset-env']
              }
          },
          {
              test: /\.css$/,
              use: [
                  MiniCssExtractPlugin.loader,
                  "css-loader"
              ]
          }
      ]
  },

  // https://webpack.js.org/concepts/plugins/
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      inject: true,
      chunks: ['index'],
      filename: 'index.html'
    }), 
    
    new MiniCssExtractPlugin(),
    new CopyPlugin({
      patterns: [
        { from: "./public/assets/", to: "assets" } 
        
      ],
    }),

  ]
};