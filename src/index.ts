import { Options } from './typings';
import { autoPreprocess } from './autoProcess';

import pugProcessor from './processors/pug';
import coffeescriptProcessor from './processors/coffeescript';
import typescriptProcessor from './processors/typescript';
import lessProcessor from './processors/less';
import scssProcessor from './processors/scss';
import stylusProcessor from './processors/stylus';
import postcssProcessor from './processors/postcss';
import globalStyleProcessor from './processors/globalStyle';

// crazy es6/cjs export mix for backward compatibility

// default auto processor
export default exports = module.exports = autoPreprocess;

// stand-alone processors to be included manually */
// Markup
export const pug = (opts: Options.Pug) => pugProcessor(opts);

// Script
export const coffeescript = (opts: Options.Coffeescript) =>
  coffeescriptProcessor(opts);
export const typescript = (opts: Options.Typescript) =>
  typescriptProcessor(opts);

// Style
export const less = (opts: Options.Less) => lessProcessor(opts);
export const scss = (opts: Options.Sass) => scssProcessor(opts);
export const sass = (opts: Options.Sass) => scssProcessor(opts);
export const stylus = (opts: Options.Stylus) => stylusProcessor(opts);
export const postcss = (opts: Options.Postcss) => postcssProcessor(opts);
export const globalStyle = () => globalStyleProcessor();
