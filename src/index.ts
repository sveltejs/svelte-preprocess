import { sveltePreprocess } from './autoProcess';

// default auto processor
// crazy es6/cjs export mix for backward compatibility

// eslint-disable-next-line no-multi-assign
export default exports = module.exports = sveltePreprocess;

// stand-alone processors to be included manually */
export { default as pug } from './processors/pug';
export { default as coffeescript } from './processors/coffeescript';
export { default as typescript } from './processors/typescript';
export { default as less } from './processors/less';
export { default as scss, default as sass } from './processors/scss';
export { default as stylus } from './processors/stylus';
export { default as postcss } from './processors/postcss';
export { default as globalStyle } from './processors/globalStyle';
export { default as babel } from './processors/babel';
export { default as replace } from './processors/replace';
