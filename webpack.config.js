const path = require('path')
const webpack = require('webpack')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const config = {
    entry: path.resolve(__dirname, 'src/match.when.ts'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'match.js',
        library: 'match',
        libraryTarget: 'umd',
    },
    externals: {
        'lodash.isequal': 'lodash.isequal'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    'awesome-typescript-loader'
                ]
            },
        ],
    },
    devtool: 'source-map',
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
            }
        })
    ]
}

if (process.env.NODE_ENV === 'production') {
    config.plugins.push(new UglifyJSPlugin({
        mangle: true,
        comments: false,
        sourceMap: true,
        compress: true
    }))
}

module.exports = config
