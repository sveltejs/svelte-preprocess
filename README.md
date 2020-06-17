![](https://github.com/kaisermann/svelte-preprocess/workflows/CI/badge.svg)

# Svelte Preprocess

> A [Svelte](https://svelte.dev) preprocessor with support for: PostCSS, SCSS, Less, Stylus, Coffeescript, TypeScript and Pug.

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=3 orderedList=false} -->
<!-- code_chunk_output -->

- [Installation](#installation)
- [Features](#features)
  - [Template tag](#template-tag)
  - [External files](#external-files)
  - [Global style](#global-style)
  - [Global rule](#global-rule)
  - [Preprocessors](#preprocessors)
  - [Modern Javascript syntax](#modern-javascript-syntax)
  - [Replace values](#replace-values)
- [Usage](#usage)
  - [With `rollup-plugin-svelte`](#with-rollup-plugin-svelte)
  - [With `svelte-loader`](#with-svelte-loader)
  - [With Sapper](#with-sapper)
  - [With Svelte VS Code](#with-svelte-vs-code)
- [Preprocessing modes](#preprocessing-modes)
  - [Auto Preprocessing](#auto-preprocessing)
  - [Standalone processors](#standalone-processors)
- [Options](#options)
- [Specifics and limitations](#specifics-and-limitations)
  - [`scss`/`sass`](#scsssass)
  - [`typescript`](#typescript)
  - [`pug`](#pug)
  - [`coffeescript`](#coffeescript)
- [FAQ](#faq)
  - [My VS Code is displaying a lot of errors on my templates when I try to use `x`...](#my-vs-code-is-displaying-a-lot-of-errors-on-my-templates-when-i-try-to-use-x)
  - [My `typescript` compilation is sloooooooow](#my-typescript-compilation-is-sloooooooow)

<!-- /code_chunk_output -->

## Installation

`npm install -D svelte-preprocess`

The preprocessor module installation is up to the developer.

- `babel`: `npm install -D @babel/core @babel/preset-...`
- `coffeescript`: `npm install -D coffeescript`
- `typescript`: `npm install -D typescript`
- `postcss`: `npm install -D postcss postcss-load-config`
- `less`: `npm install -D less`
- `sass`: `npm install -D node-sass` or `npm install -D sass`
- `pug`: `npm install -D pug`
- `stylus`: `npm install -D stylus`

_Note: If you want to load your `postcss` configuration from a external file, make sure to also install `postcss-load-config`._

## Features

### Template tag

Add _vue-like_ support for defining your markup between a `<template>` tag. The tagname can be customized to something like `markup` for example. See [#options](#options).

_Note: only for auto preprocessing_

```html
<template>
  <div>Hey</div>
</template>

<style></style>

<script></script>
```

### External files

```html
<template src="./template.html"></template>
<script src="./script.js"></script>
<style src="./style.css"></style>
```

### Global style

Add a `global` attribute to your `style` tag and instead of scoping the CSS, all of its content will be interpreted as global style.

```html
<style global>
  div {
    color: red;
  }
</style>
```

_Note<sup>1</sup>: needs PostCSS to be installed._

_Note<sup>2</sup>: if you're using it as a standalone processor, it works best if added to the end of the processors array._

_Note<sup>3</sup>: if you need to have some styles be scoped inside a global style tag, use `:local` in the same way you'd use `:global`._

### Global rule

Use a `:global` rule to only expose parts of the stylesheet:

```html
<style lang="scss">
  .scoped-style {
  }

  :global {
    @import 'global-stylesheet.scss';

    .global-style {
      .global-child-style {
      }
    }
  }
</style>
```

Works best with nesting-enabled CSS preprocessors, but regular CSS selectors like `div :global .global1 .global2` are also supported.

_Note<sup>1</sup>: needs PostCSS to be installed._

_Note<sup>2</sup>: if you're using it as a standalone processor, it works best if added to the end of the processors array._

_Note<sup>3</sup>: wrapping `@keyframes` inside `:global {}` blocks is not supported. Use the [`-global-` name prefix for global keyframes](https://svelte.dev/docs#style)._

### Preprocessors

Current supported out-of-the-box preprocessors are `SCSS`, `Stylus`, `Less`, `Coffeescript`, `TypeScript`, `Pug`, `PostCSS`, `Babel`.

```html
<template lang="pug">
  div Posts
  +each('posts as post')
    a(href="{post.url}") {post.title}
</template>

<script lang="typescript">
  // Compatible with Svelte v3...
  export const hello: string = 'world';
</script>

<style src="./style.scss"></style>

<!-- Or -->

<style lang="scss">
  $color: red;
  div {
    color: $color;
  }
</style>
```

### Modern Javascript syntax

`svelte-preprocess` allows you to run your component code through `babel` before sending it to the compiler, allowing you to use new language features such as optional operators and nullish coalescing. However, note that `babel` should transpile your component code to the javascript version supported by the Svelte compiler, so ES6+.

For example, with `@babel/preset-env` your config could be:

```js
import preprocess from 'svelte-preprocess'
  ...
  preprocess: preprocess({
    babel: {
      presets: [
        [
          '@babel/preset-env',
          {
            loose: true,
            // No need for babel to resolve modules
            modules: false,
            targets: {
              // ! Very important. Target es6+
              esmodules: true,
            },
          },
        ],
      ],
    },
  });
  ...
```

_Note: If you want to transpile your app to be supported in older browsers, you must run babel from the context of your bundler._

### Replace values

Replace a set of string patterns in your components markup by passing an array of `[RegExp, ReplaceFn | string]`, the same arguments received by the `String.prototype.replace` method.

In example, to add `process.env.{prop}` value resolution and a custom `@if/@endif` if-block shorthand, one could do:

```js
sveltePreprocess({
  replace: [
    [
      /process\.env\.(\w+)/g,
      (_:, prop) => JSON.stringify(process.env[prop]),
    ],
    [/@if\s*\((.*?)\)$/gim, '{#if $1}'],
    [/@endif$/gim, '{/if}'],
  ],
});
```

Which allows to write your component like:

```html
@if(process.env.NODE_ENV !== 'development')
<h1>Production environment!</h1>
@endif
```

And the result, for a `NODE_ENV = 'production'` would be:

```svelte
{#if "production" !== 'development'}
  <h1>Production environment!</h1>
{/if}
```

_Note<sup>1</sup>: the `replace` transformer is executed before any other transformer._

_Note<sup>2</sup>: it is **NOT** recommended to modify Svelte's syntax._

## Usage

### With `rollup-plugin-svelte`

```js
// rollup.config.js
import svelte from 'rollup-plugin-svelte';
import autoPreprocess from 'svelte-preprocess'
import { scss, coffeescript, pug } from 'svelte-preprocess'

export default {
  ...,
  plugins: [
    svelte({
      /**
       * Auto preprocess supported languages with
       * '<template>'/'external src files' support
       **/
      preprocess: autoPreprocess({ /* options */ })
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

### With `svelte-loader`

```js
  ...
  module: {
    rules: [
      ...
      {
        test: /\.(html|svelte)$/,
        exclude: /node_modules/,
        use: {
          loader: 'svelte-loader',
          options: {
            preprocess: require('svelte-preprocess')({ /* options */ })
          },
        },
      },
      ...
    ]
  }
  ...
```

### With Sapper

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

### With Svelte VS Code

[svelte-vscode](https://marketplace.visualstudio.com/items?itemName=JamesBirtles.svelte-vscode) needs to know how its (svelte) language server should preprocess your files. This can be achieved by creating a `svelte.config.js` file at the root of your project which exports a svelte options object (similar to `svelte-loader` and `rollup-plugin-svelte`).

**Example**:

```js
// svelte.config.js
import sveltePreprocess from 'svelte-preprocess';

module.exports = {
  preprocess: sveltePreprocess({
    // ...svelte-preprocess options
  }),
  // ...other svelte options
};
```

_Tip: this file can be imported in your bundle config instead of having multiple svelte configurations lying around._

## Preprocessing modes

`svelte-preprocess` can be used in two ways: _auto preprocessing_ and with _stand-alone_ processors.

### Auto Preprocessing

In auto preprocessing mode, `svelte-preprocess` automatically uses the respective preprocessor for your code based on your `type="..."` or `lang="..."` attributes. It also handles the `<template>` tag for markup, external files and global styling. It's as simple as importing the module and executing the default exported method.

```js
import preprocess from 'svelte-preprocess'

...
  {
    /* svelte options */
    ...,
    preprocess: preprocess({ /* options */ }),
  }
...
```

[Svelte v3 has added support for multiple processors](https://svelte.dev/docs#svelte_preprocess), so it's also possible to use `svelte-preprocess` with other preprocessors:

```js
import preprocess from 'svelte-preprocess'
import { mdsvex } from 'mdsvex'
...
  {
    /* svelte options */
    ...,
    preprocess: [
      preprocess({ /* svelte-preprocess options */ }),
      mdsvex({ /* mdsvex options */ })
    ],
  }
...
```

### Standalone processors

In case you want to manually configure your preprocessing step, `svelte-preprocess` exports these named processors:

- `pug`
- `coffeescript`
- `typescript`
- `less`
- `scss` or `sass`
- `stylus`
- `postcss`
- `babel`
- `globalStyle` - transform `<style global>` into global styles and supports `:global` nested selectors.
- `replace` - replace string patterns in your markup.

```js
import { scss, coffeescript, pug, globalStyle } from 'svelte-preprocess';

svelte.preprocess(input, [pug(), coffeescript(), scss(), globalStyle()]);
```

Every processor accepts an option object which is passed to its respective underlying tool.

```js
import { scss, postcss } from 'svelte-preprocess';

svelte.preprocess(input, [
  scss(),
  postcss({
    plugins: [
      require('autoprefixer')({
        browsers: 'last 2 versions',
      }),
    ],
  }),
]);
```

**Note**: there's no built-in support for \<template\> tag when using standalone processors.

## Options

`svelte-preprocess` in _auto-processing_ mode can receive an options object.

```js
import svelte from 'svelte';
import sveltePreprocess from 'svelte-preprocess';
const options = {
  /**
   * Define which tag should `svelte-preprocess` look for markup content.
   *
   * This is only used if you desire to define your markup between this tag
   * or to import it from a external file.
   *
   * The example below means your markup can be defined inside a `<markup>` tag.
   **/
  markupTagName: 'markup',
  /**
   * Extend the default language alias dictionary.
   * Each entry must follow: ['alias', 'languageName']
   */
  aliases: [
    /**
     * Means
     * <... src="./file.cst"> or
     * <... lang="cst"> or
     * <... type="text/customLanguage">
     * <... type="application/customLanguage">
     * will be treated as the language 'customLanguage'
     */
    ['cst', 'customLanguage'],
  ],

  preserve: [
    /**
     * Using the same matching algorithm as above, don't parse,
     * modify, or remove from the markup, tags which match the
     * language / types listed below.
     * **/
    'ld+json',
  ],

  /** Disable a language by setting it to 'false' */
  scss: false,

  /** or pass an option to render synchronously and any other node-sass or sass options*/
  scss: {
    renderSync: true,
    /** Explicitly set the scss implementation to use */
    implementation: require('sass'),
  },

  /**  Pass options to the default preprocessor method */
  stylus: {
    paths: ['node_modules'],
  },

  /**
   * Post process css with PostCSS by defining 'transformers.postcss' property,
   * either pass 'true' to activate PostCSS transforms and use the `postcss.config.js`
   */
  postcss: true,

  /** or pass an object with postcss plugins and their options directly. */
  postcss: {
    plugins: [require('autoprefixer')({ browsers: 'last 2 versions' })],
  },

  typescript: {
    /**
     * Optionally specify the directory to load the tsconfig from
     */
    tsconfigDirectory: './configs',

    /**
     * Optionally specify the full path to the tsconfig
     */
    tsconfigFile: './tsconfig.app.json',

    /**
     * Optionally specify compiler options.
     * These will be merged with options from the tsconfig if found.
     */
    compilerOptions: {
      module: 'es2015',
    },

    /**
     * Type checking can be skipped by setting 'transpileOnly: true'.
     * This speeds up your build process.
     */
    transpileOnly: true,
  },

  /** Use a custom preprocess method by passing a function. */
  pug({ content, filename, attributes }) {
    const code = pug.render(content);

    return { code, map: null };
  },

  /** Add a custom language preprocessor */
  customLanguage({ content, filename, attributes }) {
    const { code, map } = require('custom-language-compiler')(content);

    return { code, map };
  },

  /** Replace string patterns in your markup */
  replace: [
    // Replace `process.env.{prop}` with the actual stringified value.
    [
      /process\.env\.(\w+)/g,
      (_: string, match: string) => JSON.stringify(process.env[match]),
    ],
    // Example of "supporting" a blade-like syntax:
    [/@if\s*\((.*?)\)$/gim, '{#if $1}'],
    [/@elseif\s*\((.*?)\)$/gim, '{:else if $1}'],
    [/@else$/gim, '{:else}'],
    [/@endif$/gim, '{/if}'],
    [/@each\s*\((.*?)\)$/gim, '{#each $1}'],
    [/@endeach$/gim, '{/each}'],
    [/@await\s*\((.*?)\)$/gim, '{#await $1}'],
    [/@then\s*(?:\((.*?)\))?$/gim, '{:then $1}'],
    [/@catch\s*(?:\((.*?)\))?$/gim, '{:catch $1}'],
    [/@endawait$/gim, '{/await}'],
    [/@debug\s*\((.*?)\)$/gim, '{@debug $1}'],
    [/@html\s*\((.*?)\)$/gim, '{@html $1}'],
  ],

  /** Configure globalStyle source map options */
  globalStyle: {
    sourceMap: true,
  },
};

svelte.preprocess(input, sveltePreprocess(options));
```

## Specifics and limitations

### `scss`/`sass`

The SCSS/SASS processor accepts the default sass options alongside two other props:

- `data: string` - a string prepended to every scss file processed.
- `renderSync: boolean` - if `true`, use the sync render method which is faster for dart sass.
- `implementation: object` - pass the module to use to compile sass, if unspecified, `svelte-preprocess` will first look for `node-sass` and then for `sass`.

### `typescript`

Since `typescript` is not officially supported by `svelte` for its template language, `svelte-preprocess` only type checks code in the `<script></script>` tag.

The following compiler options are not supported:

- `noUnusedLocals`
- `noEmitOnError`
- `declarations`

### `pug`

#### Template blocks

Some of Svelte's template syntax is invalid in `pug`. `svelte-preprocess` provides some pug mixins to represent svelte's `{#...}{/...}` blocks: `+if()`, `+else()`, `+elseif()`, `+each()`, `+await()`, `+then()`, `+catch()`, `+debug()`.

```pug
ul
  +if('posts && posts.length > 1')
    +each('posts as post')
      li
        a(rel="prefetch" href="blog/{post.slug}") {post.title}
    +else()
      span No posts :c
```

#### Element attributes

Pug encodes everything inside an element attribute to html entities, so `attr="{foo && bar}"` becomes `attr="foo &amp;&amp; bar"`. To prevent this from happening, instead of using the `=` operator use `!=` which won't encode your attribute value:

```pug
button(disabled!="{foo && bar}")
```

#### Svelte Element directives

Syntax for use Svelte Element directives with Pug

```pug
input(bind:value="{foo}")
input(on:input="{bar}")
```

### `coffeescript`

#### Safety wrapper

Since `coffeescript` transpiles variables to `var` definitions, it uses a safety mechanism to prevent variables from bleeding to outside contexts. This mechanism consists of wrapping your `coffeescript` code inside an IIFE which, unfortunately, prevents `svelte` from finding your variables. To bypass this behavior, `svelte-preprocess` sets the [`bare` coffeescript compiler option](https://coffeescript.org/#lexical-scope) to `true`.

## FAQ

### My VS Code is displaying a lot of errors on my templates when I try to use `x`...

![image](https://user-images.githubusercontent.com/2388078/63219174-8d4d8b00-c129-11e9-9fb0-56260a125155.png)

If you have configured `svelte-preprocess` to use some kind of preprocessor and `svelte-vscode` is displaying errors like it's ignoring your preprocess configuration, that's happening because `svelte-vscode` needs to know how to preprocess your components. `svelte-vscode` works by having a svelte compiler running on the background and you can configure it by [creating a `svelte.config.js`](#with-svelte-vs-code) file on your project's root. Please check this document [With Svelte VS Code](#with-svelte-vs-code) section.

### My `typescript` compilation is sloooooooow

If you have a medium-to-big project, the typescript processor might start to get slow. If you already have an IDE type checking your code, you can speed up the transpilation process by setting `transpileOnly` to `true`:

```js
import preprocess from 'svelte-preprocess'
...
{
  ...svelteOptions,
  preprocess: preprocess({
    typescript: {
      // skips type checking
      transpileOnly: true,
      compilerOptions: {
        ...
      },
    },
  })
}
...
```

Warning: If you do this, you can't import types or interfaces into your svelte component without using the new TS 3.8 `type` import modifier: `import type { SomeInterface } from './MyModule.ts'` otherwise Rollup (and possibly others) will complain that the name is not exported by `MyModule`)
