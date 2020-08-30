
import sveltePreprocess from 'svelte-preprocess';
// const sveltePreprocess = require('../../dist/index.js')

sveltePreprocess({
  replace: [['foo', 'bar']]
})