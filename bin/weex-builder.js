#!/usr/bin/env node
const program = require('commander')
const builder = require('../index')
const chalk = require('chalk')
const Gauge = require('gauge')
const pathTool = require('path')
let showHelp = true
program.version(require('../package.json').version)
    .option('-v,--version', 'show version')
    .option('-e,--ext [ext]', 'set enabled extname for compiler default is vue|we')
    .option('-web,--web', 'set web mode for h5 render')
    .option('-w,--watch', 'watch files and rebuild')
    .option('-d,--devtool [devtool]', 'set webpack devtool mode')
    .option('-m,--min', 'compress the output js (will disable inline-source-map)')
    .option('-x,--external-webpack', 'use webpack.config.js in project as webpack configuration file')
    .arguments('<source> <dest>')
    .action(function (source, dest) {
        showHelp = false
        let gauge = new Gauge()
        let maxProgress = 0
        let babelConfig
        builder.build(source, dest, {
            onProgress: function (complete, action) {
                if (complete > maxProgress) {
                    maxProgress = complete
                }
                else {
                    complete = maxProgress
                }
                gauge.show(action, complete)
            },
            watch: program.watch,
            devtool: program.devtool,
            ext: pathTool.extname(source) || program.ext || 'vue|we',
            web: !!program.web,
            min: !!program.min,
            externalWebpack: !!program.externalWebpack
        }, function (err, output, json) {
            gauge.hide()
            if (err) {
                console.log(chalk.red('Build Failed!'));
                if(typeof err.forEach === 'function'){
                    err.forEach(e => console.error(e));
                }else{
                    console.log(JSON.stringify(err));
                }
            }
            else {
                console.log('Build completed!\nChild')
                console.log(output.toString())
            }

        })
})
program.parse(process.argv)
if (showHelp)program.outputHelp()