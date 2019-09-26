import { Options as SassOptions } from 'sass';

import { autoPreprocess } from './autoProcess';

import pug from './processors/pug';
import coffeescript from './processors/coffeescript';
import typescript from './processors/typescript';
import less from './processors/less';
import scss from './processors/scss';
import stylus from './processors/stylus';
import postcss from './processors/postcss';
import globalStyle from './processors/globalStyle';

interface ProcessorOptions {
  [key: string]: unknown;
}

export {
  pug,
  coffeescript,
  typescript,
  less,
  scss,
  scss as sass,
  stylus,
  postcss,
  globalStyle,
};

// for backward compatibility

/** default auto processor */
module.exports = autoPreprocess;

/** stand-alone processors to be included manually */
/** Markup */
module.exports.pug = (opts: ProcessorOptions) => pug(opts);

/** Script */
module.exports.coffeescript = (opts: ProcessorOptions) => coffeescript(opts);
module.exports.typescript = (opts: ProcessorOptions) => typescript(opts);

/** Style */
module.exports.less = (opts: ProcessorOptions) => less(opts);
module.exports.scss = (opts: Omit<SassOptions, 'file'>) => scss(opts);
module.exports.sass = (opts: Omit<SassOptions, 'file'>) => scss(opts);
module.exports.stylus = (opts: ProcessorOptions) => stylus(opts);
module.exports.postcss = (opts: ProcessorOptions) => postcss(opts);
module.exports.globalStyle = (opts: ProcessorOptions) => globalStyle(opts);
