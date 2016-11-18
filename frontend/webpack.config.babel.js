export default {
  output: {
    filename: 'client.js'
  },
  devtool: 'source-map',
  module: {
    noParse: /.*(localforage.js|clike.js)/,
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: [/node_modules/]
      }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  }
}
