'use strict';
const webpack = require('webpack');
const path = require('path');
const exec = require('child_process');

const build_pkg = require('./package.json');
const build_git = exec.execSync('git rev-parse --short HEAD').toString();
const build_date = exec.execSync('date -u +"%Y-%m-%d"').toString();

module.exports = (env, argv) => ({
    mode: 'none',
    context: __dirname,
    entry: {
        index: path.resolve(__dirname, 'www', 'index.js')
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname , 'dist', 'www'),
        publicPath: '/xc-score/'
    },
    resolve: {
        modules: ['node_modules'],
        alias: {
            'igc-xc-score': path.resolve(__dirname, 'index.js'),
            jquery: 'jquery/dist/jquery.min.js',
        }
    },
    devtool: argv.mode == 'development' ? 'eval' : undefined,
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
        }),
        new webpack.DefinePlugin({
            __BUILD_GIT__: JSON.stringify(build_git),
            __BUILD_PKG__: JSON.stringify(build_pkg),
            __BUILD_DATE__: JSON.stringify(build_date),
        })
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    optimization: {
        usedExports: true,
        splitChunks: {
            chunks: 'all'
        }
    }
});
