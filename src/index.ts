import { autoPreprocess } from './autoProcess';

// default auto processor
// crazy es6/cjs export mix for backward compatibility
export default exports = module.exports = autoPreprocess;

// stand-alone processors to be included manually */
export { default as pug } from './processors/pug';
export { default as coffeescript } from './processors/coffeescript';
export { default as typescript } from './processors/typescript';
export { default as less } from './processors/less';
export { default as scss, default as sass } from './processors/scss';
export { default as stylus } from './processors/stylus';
export { default as postcss } from './processors/postcss';
export { default as globalStyle } from './processors/globalStyle';
