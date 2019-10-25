import { Options as SassOptions } from 'sass';

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
export const pug = (opts: any) => pugProcessor(opts);

// Script
export const coffeescript = (opts: any) => coffeescriptProcessor(opts);
export const typescript = (opts: any) => typescriptProcessor(opts);

// Style
export const less = (opts: any) => lessProcessor(opts);
export const scss = (opts: Omit<SassOptions, 'file'>) => scssProcessor(opts);
export const sass = (opts: Omit<SassOptions, 'file'>) => scssProcessor(opts);
export const stylus = (opts: any) => stylusProcessor(opts);
export const postcss = (opts: any) => postcssProcessor(opts);
export const globalStyle = (opts: any) => globalStyleProcessor(opts);
