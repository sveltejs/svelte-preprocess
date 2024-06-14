import { sveltePreprocess } from './autoProcess';

// default auto processor
// crazy es6/cjs export mix for backward compatibility
/** @deprecated Use the named export instead: `import { sveltePreprocess } from 'svelte-preprocess'` */
// eslint-disable-next-line no-multi-assign
export default exports = module.exports = sveltePreprocess;

// also export auto preprocessor as named export to sidestep default export type issues with "module": "NodeNext" in tsconfig.
// Don't just do export { sveltePreprocess } because the transpiled output is wrong then.
export { sveltePreprocess } from './autoProcess';

// stand-alone processors to be included manually, use their named exports for better transpilation or else node will not detect the named exports properly
export { pug } from './processors/pug';
export { coffeescript } from './processors/coffeescript';
export { typescript } from './processors/typescript';
export { less } from './processors/less';
export { scss, sass } from './processors/scss';
export { stylus } from './processors/stylus';
export { postcss } from './processors/postcss';
export { globalStyle } from './processors/globalStyle';
export { babel } from './processors/babel';
export { replace } from './processors/replace';
