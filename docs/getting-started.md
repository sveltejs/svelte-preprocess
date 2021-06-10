# Getting Started

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [1. Installation](#1-installation)
- [2. Adding `svelte-preprocess` to our build workflow](#2-adding-svelte-preprocess-to-our-build-workflow)
- [3. Configuring preprocessors](#3-configuring-preprocessors)
  - [3.1 Prepending content](#31-prepending-content)

<!-- /code_chunk_output -->

_Note: The examples below are going to be using a hypothetical `rollup.config.js` as if we were configuring a simple Svelte application, but `svelte-preprocess` can be used in various setups. See "[Usage](usage.md)"._

## 1. Installation

First things first, let's create a new Svelte app project and add `svelte-preprocess`.

```shell
$ npx degit sveltejs/template my-svelte-app
$ cd my-svelte-app
$ npm install -D svelte-preprocess
```

`svelte-preprocess` doesn't have any language-specific dependency, so it's up to us to install the rest of tools we are going to use:

- Babel: `npm install -D @babel/core @babel/preset-...`
- CoffeeScript: `npm install -D coffeescript`
- TypeScript: `npm install -D typescript`
- PostCSS: `npm install -D postcss postcss-load-config`
- SugarSS: `npm install -D postcss sugarss`
- Less: `npm install -D less`
- Sass: `npm install -D node-sass` or `npm install -D sass`
- Pug: `npm install -D pug`
- Stylus: `npm install -D stylus`

For now, let's just install the main library.

## 2. Adding `svelte-preprocess` to our build workflow

Let's use `svelte-preprocess` in [auto-preprocessing mode](/docs/preprocessing.md#auto-preprocessing) and add it to our `rollup.config.js`:

```diff
import svelte from 'rollup-plugin-svelte'
+ import sveltePreprocess from 'svelte-preprocess';

const production = !process.env.ROLLUP_WATCH

export default {
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/bundle.js',
  },
  plugins: [
    svelte({
+      preprocess: sveltePreprocess(),
      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file — better for performance
      css: css => {
        css.write('public/bundle.css')
      },
    }),
  ],
}
```

Now our app's code can be written in any of the syntaxes supported by `svelte-preprocess`: Sass, Stylus, Less, CoffeeScript, TypeScript, Pug, PostCSS, Babel.

_**Note:** If you use VS Code, check [its usage guide](/docs/usage.md#with-svelte-vs-code) to make the Svelte VS Code extension understand the content of your components._

## 3. Configuring preprocessors

Now let's assume our app markup is going to be written in Pug, our scripts in TypeScript, and our styles in Sass. We also want our styles to be auto-prefixed, so we're also going to need PostCSS. Let's install these dependencies:

**Important:** `svelte-preprocess` only handles content passed to it by `svelte-loader`, `rollup-plugin-svelte` and similar tools. If our TypeScript component import a TypeScript file, the bundler will be the one responsible for handling it. We must make sure it knows how to handle it!

```shell
$ npm i -D typescript sass postcss autoprefixer pug @rollup/plugin-typescript
```

After the installation is complete, we still need to configure our PostCSS options and add `@rollup/plugin-typescript` to our config.

```diff
import svelte from 'rollup-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess';
+ import typescript from '@rollup/plugin-typescript';

const production = !process.env.ROLLUP_WATCH

export default {
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/bundle.js',
  },
  plugins: [
+    // teach rollup how to handle typescript imports
+    typescript({ sourceMap: !production }),
    svelte({
+      preprocess: sveltePreprocess({
+         sourceMap: !production,
+         postcss: {
+           plugins: [require('autoprefixer')()]
+         }
+      }),
      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file — better for performance
      css: css => {
        css.write('public/bundle.css')
      },
    }),
  ],
}
```

And we're done! Our components can now be written as:

```html
<template lang="pug">
  h1 {name}
</template>

<script lang="ts">
  export let name: string = 'world';
</script>

<style lang="scss">
  h1 {
    color: red;
  }
</style>
```
### 3.1 Prepending content

Now we're in need of a SCSS file to hold some variables. Let's assume it's created at `src/styles/variables.scss`.

```scss
// src/styles/variables.scss
$primary-color: red;
```

As in any SCSS project, we could just `@use './path/to/variables.scss`, but that can also become boring. `svelte-preprocess` [accepts a `prependData`](/docs/preprocessing.md#preprocessors) for almost every processor. Let's use it to prepend our import!

```diff
import svelte from 'rollup-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess';

export default {
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/bundle.js',
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess({
         sourceMap: !production,
+        scss: {
+          // We can use a path relative to the root because
+          // svelte-preprocess automatically adds it to `includePaths`
+          // if none is defined.
+          prependData: `@import 'src/styles/variables.scss';`
+        },
         postcss: {
           plugins: [require('autoprefixer')()]
         }
      }),
      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file — better for performance
      css: css => {
        css.write('public/bundle.css')
      },
    }),
  ],
}
```

Voila! We can now reference a variable from our file without having to explicitly import it.

```html
<template lang="pug">
  h1 {name}
</template>

<script lang="ts">
  export let name: string = 'world';
</script>

<style lang="scss">
  h1 {
    color: $primary-color;
  }
</style>
```
