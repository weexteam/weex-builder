/**
 * Created by exolution on 17/1/6.
 */
const WebpackBuilder = require('./webpackBuilder');
const webpack = require('webpack');
const vueLoaderConfig = require('./vueLoader');
const defaultExt = ['we', 'vue', 'js'];
const path = require('path');
const utils = require('./utils');

class WeexBuilder extends WebpackBuilder {
  constructor (source, dest, options = {}) {
    if (!(options.ext && typeof options.ext === 'string')) {
      options.ext = defaultExt.join('|');
    }

    super(source, dest, 'webpack.config.js', options);
  }
  initConfig (callback) {
    const destExt = path.extname(this.dest);
    const sourceExt = path.extname(this.sourceDef);
    let dir;
    let filename;
    const plugins = [
      /*
       * Plugin: BannerPlugin
       * Description: Adds a banner to the top of each generated chunk.
       * See: https://webpack.js.org/plugins/banner-plugin/
       */
      new webpack.BannerPlugin({
        banner: '// { "framework": "Vue"} \n',
        raw: true,
        exclude: 'Vue'
      })
    ];
    // ./bin/weex-builder.js test dest --filename=[name].web.js
    if (this.options.filename) {
      filename = this.options.filename;
    }
    else {
      filename = '[name].js';
    }
    // Call like: ./bin/weex-builder.js test/index.vue dest/test.js
    // Need to rename the filename of
    if (destExt && this.dest[this.dest.length - 1] !== '/' && sourceExt) {
      dir = path.dirname(this.dest);
      filename = path.basename(this.dest);
    }
    else {
      dir = this.dest;
    }

    if (this.options.onProgress) {
      plugins.push(new webpack.ProgressPlugin(this.options.onProgress));
    }
    if (this.options.min) {
      /*
      * Plugin: UglifyJsPlugin
      * Description: Minimize all JavaScript output of chunks.
      * Loaders are switched into minimizing mode.
      *
      * See: https://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
      */
      plugins.push(new webpack.optimize.UglifyJsPlugin({
        minimize: true,
        sourceMap: !!this.options.devtool
      }));
    }
    const webpackConfig = () => {
      const entrys = {};
      this.source.forEach(s => {
        let file = path.relative(path.resolve(this.base), s);
        file = file.replace(/\.\w+$/, '');
        if (!this.options.web) {
          s += '?entry=true';
        }
        entrys[file] = s;
      });
      const configs = {
        entry: entrys,
        output: {
          path: dir,
          filename: filename
        },
        watch: this.options.watch || false,
        devtool: this.options.devtool || false,
        /*
        * Options affecting the resolving of modules.
        *
        * See: http://webpack.github.io/docs/configuration.html#module
        */
        module: {
          rules: [{
            test: /\.js$/,
            use: [{
              loader: 'babel-loader'
            }]
          }, {
            test: /\.we$/,
            use: [{
              loader: 'weex-loader'
            }]
          }]
        },
        resolve: {
          alias: {
            'babel-runtime': utils.loadModulePath('babel-runtime', 'core-js'),
            'babel-polyfill': utils.loadModulePath('babel-polyfill')
          }
        },
        /**
         * See: https://webpack.js.org/configuration/resolve/#resolveloader
         */
        resolveLoader: {
          modules: [path.join(__dirname, '../node_modules'), path.resolve('node_modules')],
          extensions: ['.js', '.json'],
          mainFields: ['loader', 'main'],
          moduleExtensions: ['-loader']
        },
        /*
        * Add additional plugins to the compiler.
        *
        * See: http://webpack.github.io/docs/configuration.html#plugins
        */
        plugins: plugins
      };
      if (this.options.web) {
        configs.module.rules.push({
          test: /\.vue(\?[^?]+)?$/,
          use: [{
            loader: 'vue-loader',
            options: Object.assign(vueLoaderConfig({ useVue: true, usePostCSS: false }), {
              /**
               * important! should use postTransformNode to add $processStyle for
               * inline style prefixing.
               */
              optimizeSSR: false,
              compilerModules: [{
                postTransformNode: el => {
                  el.staticStyle = `$processStyle(${el.staticStyle})`;
                  el.styleBinding = `$processStyle(${el.styleBinding})`;
                }
              }]
            })
          }]
        });
      }
      else {
        configs.module.rules.push({
          test: /\.vue(\?[^?]+)?$/,
          use: [{
            loader: 'weex-loader',
            options: vueLoaderConfig({ useVue: false })
          }]
        });
        configs.node = {
          setImmediate: false,
          dgram: 'empty',
          fs: 'empty',
          net: 'empty',
          tls: 'empty',
          child_process: 'empty'
        };
      }
      return configs;
    };

    if (this.options.externalWebpack) {
      const externalWebpack = require(this.webpackExtConfigPath);

      this.processWebpackConfig(externalWebpack, (config) => {
        this.config = config;
        console.log(JSON.stringify(config));
        callback();
      });
    }
    else {
      this.config = webpackConfig();
      callback();
    }
  }

  processWebpackConfig (config, callback) {
    if (typeof config === 'function') {
      // process Function
      this.processWebpackConfig(config(process.env), callback);
    }
    else	if (typeof config.then === 'function') {
      // process Promise
      config.then((conf) => {
        this.processWebpackConfig(conf, callback)
      });
    }
    else if (typeof config === 'object') {
      // process Object
      callback(config);
      return config;
    }
  } 
}
module.exports = WeexBuilder;
