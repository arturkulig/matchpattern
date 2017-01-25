var path = require('path')
var webpack = require('webpack')

var config = {
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
        extensions: ['.ts', '.js', '']
    },
    module: {
        loaders: [
            {
                test: /\.ts$/,
                loader: 'ts-loader'
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
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
        compressor: {
            pure_getters: true,
            unsafe: true,
            unsafe_comps: true,
            screw_ie8: true,
            warnings: false
        }
    }))
}

module.exports = config
