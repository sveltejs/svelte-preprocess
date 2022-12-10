# Usage

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [With Svelte VS Code](#with-svelte-config)
- [With SvelteKit](#with-svelte-config)
- [With `rollup-plugin-svelte`](#with-rollup-plugin-svelte)
- [With `svelte-loader`](#with-svelte-loader)
- [With Sapper](#with-sapper)

<!-- /code_chunk_output -->

## With Svelte Config

Some tools of the Svelte ecosystem, such as [svelte-vscode](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) and [svelte-kit](https://github.com/sveltejs/kit), need access to your svelte configuration so they know how to properly handle your Svelte files. This can be achieved by creating a `svelte.config.js` file at the root of your project which exports a svelte options object (similar to `svelte-loader` and `rollup-plugin-svelte`).

**Example**:

Write the config in ESM style when you have `"type": "module"` in your `package.json`. This is the case for Vite starters and SvelteKit projects.

```js
// svelte.config.js
import preprocess from 'svelte-preprocess';

/** 
 * This will add autocompletion if you're working with SvelteKit
 * 
 * @type {import('@sveltejs/kit').Config} 
 */
const config = {
  preprocess: preprocess({
    // ...svelte-preprocess options
  }),
  // ...other svelte options
};

export default config;
```

Write the config in CommonJS style when you don't have `"type": "module"` in your `package.json`. This is the case for the Svelte starter template.

```js
// svelte.config.js
const sveltePreprocess = require('svelte-preprocess');
module.exports = {
  preprocess: sveltePreprocess({
    // ...svelte-preprocess options
  }),
  // ...other svelte options
};
```


_Tip: this file can be imported in your bundle config instead of having multiple svelte configurations lying around._

## With `rollup-plugin-svelte`

```js
// rollup.config.js
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess'
import { scss, coffeescript, pug } from 'svelte-preprocess'

export default {
  ...,
  plugins: [
    svelte({
      /**
       * Auto preprocess supported languages with
       * '<template>'/'external src files' support
       **/
      preprocess: sveltePreprocess({ /* options */ })
      /**
       * It is also possible to manually enqueue
       * stand-alone processors
       * */
      preprocess: [
        pug({ /* pug options */ }),
        scss({ /* scss options */ }),
        coffeescript({ /* coffeescript options */ })
      ]
    })
  ]
}
```

## With `svelte-loader`

```js
  ...
  module: {
    rules: [
      ...
      {
        test: /\.(html|svelte)$/,
        exclude: [],
        use: {
          loader: 'svelte-loader',
          options: {
            preprocess: require('svelte-preprocess')({
              /* options */
          })
          },
        },
      },
      ...
    ]
  }
  ...
```

## With Sapper

[Sapper](https://sapper.svelte.dev/) has two build configurations, one for the client bundle and one for the server. To use `svelte-preprocess` with Sapper, you need to define it on both configurations.

```js
// ...
import sveltePreprocess from 'svelte-preprocess';

const preprocess = sveltePreprocess({
  postcss: true,
  // ...
});

export default {
  client: {
    plugins: [
      svelte({
        preprocess,
        // ...
      }),
  },
  server: {
    plugins: [
      svelte({
        preprocess,
        // ...
      }),
    ],
  },
};
```
