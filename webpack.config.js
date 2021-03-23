const path = require('path');
const fs = require('fs');

module.exports = {
    entry: {
        main: './src/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: "/",        
        filename: 'PeerClient.min.js',
        libraryTarget: 'umd',
        libraryExport: 'default',
        library: 'PeerClient',
        umdNamedDefine: true,
        globalObject: `(typeof self !== 'undefined' ? self : this)`
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
        ]
    }
}
