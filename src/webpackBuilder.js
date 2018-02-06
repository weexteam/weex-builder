/**
 * Created by exolution on 17/1/6.
 */
const path = require('path');
const sourcer = require('sourcer');
const webpack = require('webpack'); 
module.exports = class WebpackBuilder {
  constructor (source, dest, webpackExtConfigName, options = {}) {
    const root = options.root || process.cwd();
    this.sourceDef = source;
    this.source = sourcer.find(root, source, {
      recursive: true
    });
    this.base = sourcer.base(source);
    if (options.ext) {
      const reg = new RegExp('\\.(' + options.ext + ')$');
      this.source = this.source.filter(s => reg.test(path.extname(s)));
    }
    this.dest = path.resolve(dest);
    this.options = options;
    this.webpackExtConfigPath = path.relative(__dirname, path.resolve(webpackExtConfigName));
  }

  build (callback) {
    this.initConfig(() => {
      if (this.source.length === 0) {
        return callback('no ' + (this.options.ext || '') + ' files found in source "' + this.sourceDef + '"');
      }
      const compiler = webpack(this.config);
      const formatResult = (err, stats) => {
        const result = {
          toString: () => stats.toString({
            /** Add warnings */
            warnings: false,
            /** Add webpack version information */
            version: false,
            /** Add the hash of the compilation */
            hash: false,
            /** Add asset Information */
            assets: true,
            modules: false,
            /** Add built modules information to chunk information */
            chunkModules: false,
            /** Add the origins of chunks and chunk merging info */
            chunkOrigins: false,
            children: false,
            chunks: false, // Makes the build much quieter
            colors: true // Shows colors in the console
          })
        };
        if (err) {
          console.error(err.stack || err);
          if (err.details) {
            console.error(err.details);
          }
          return callback && callback(err);
        }
  
        const info = stats.toJson();
        if (stats.hasErrors()) {
          return callback && callback(info.errors);
        }
        callback && callback(err, result, info);
      };
      if (this.config.watch) {
        compiler.watch({
          ignored: /node_modules/,
          poll: 1000
        }, formatResult);
      }
      else {
        compiler.run(formatResult);
      }
    });
    
  }
};
