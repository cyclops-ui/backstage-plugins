const path = require('path');

module.exports = {
  entry: './src/index.tsx',  // Entry point for your Backstage plugin
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(ts)$/, // Process TypeScript files
        use: 'ts-loader', // or babel-loader with @babel/preset-typescript
        exclude: /node_modules/,
      }
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },
  mode: 'development', // Change to 'production' for production builds
};
