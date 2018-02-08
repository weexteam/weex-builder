const WeexBuilder = require('./src/weexBuilder');
exports.build = function (source, dest, options,callback) {
    if(!source||typeof source!=='string'||(Array.isArray(source)&&source.length==0)){
        return Promise.reject('The source path can not be empty!');
    }
    if(!dest||typeof dest!=='string'){
        return Promise.reject('The output path can not be empty or non-string!');
    }
    return new WeexBuilder(source, dest, options).build(callback);
}