# Preprocessing

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=3 orderedList=false} -->

<!-- code_chunk_output -->

- [Preprocessor Modes](#preprocessor-modes)
  - [Auto Preprocessing](#auto-preprocessing)
  - [Stand-alone processors](#stand-alone-processors)
- [Preprocessors](#preprocessors)
  - [`babel`](#babel)
  - [`coffeescript`](#coffeescript)
  - [`globalStyle`](#globalstyle)
  - [`less`](#less)
  - [`postcss`](#postcss)
  - [`pug`](#pug)
  - [`replace`](#replace)
  - [`scss/sass`](#scsssass)
  - [`stylus`](#stylus)
  - [`typescript`](#typescript)
- [Difference between the auto and stand-alone modes](#difference-between-the-auto-and-stand-alone-modes)

<!-- /code_chunk_output -->

`svelte-preprocess` can be used in two ways: _auto preprocessing_ and with _stand-alone_ processors.

The examples below are going to be using a hypothetical `rollup.config.js`, but `svelte-preprocess` can be used in multiple scenarios, see "[Usage](docs/usage.md)".

## Preprocessor Modes

### Auto Preprocessing

In auto preprocessing mode, `svelte-preprocess` automatically uses the respective preprocessor for your code based on a tag's `src`, `lang` or `type` attribute. It also handles the `<template>` tag for markup, external files and global styling.

```js
import svelte from 'rollup-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess'

export default {
  plugins: [
    svelte({
      preprocess: sveltePreprocess({ ... })
    })
  ]
}
```

As `svelte-preprocess` is just a Svelte preprocessor like any oter, it's also possible to use it alongside other preprocessors:

```js
import preprocess from 'svelte-preprocess'
import { mdsvex } from 'mdsvex'
...
  {
    /* svelte options */
    preprocess: [
      preprocess({ ... }),
      mdsvex({ ... })
    ],
  }
...
```

#### Auto preprocessing options

The following options can be passed to the preprocessor. None are required:

| Option          | Default                                                  | Description                                                                                                                                                                                                                                                                                                           |
| --------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `markupTagName` | `"template"`                                             | `string` that sets the name of the tag `svelte-preprocess` looks for markup in custom languages.<br><br>i.e `markup` makes it possible to write your markup between `<markup lang="..."></markup>` tag.                                                                                                               |
| `aliases`       | `null`                                                   | A list of tuples `[alias: string, language: string]` that correlates an `alias` to a `language`<br><br>i.e `['cst', 'customLanguage']` means<br>`<... src="./file.cst">`<br>`<... lang="cst">`<br>`<... type="text/customLanguage">`<br>`<... type="application/customLanguage">`<br>are treated as `customLanguage`. |
| preserve        | `[]`                                                     | A `string` list of languages/aliases that shouldn't pass through the preprocessor. (i.e `ld+json`)                                                                                                                                                                                                                    |
| `defaults`      | `{ markup: 'html', script: 'javascript', style: 'css' }` | An `object` that defines the default languages of your components.<br><br>i.e: `{ script: 'typescript' }` makes Typescript the default language, removing the need of adding `lang="ts"` to `script` tags.                                                                                                            |
| `sourceMap`     | `true`                                                   | If `true`, `svelte-preprocess` generates sourcemap for every language that supports it.                                                                                                                                                                                                                               | `typescript` | `undefined` | Define options passed to the `typescript` processor |

##### Configuring preprocessors

Alongside the options above, you can also configure options of specific preprocessors:

```js
import sveltePreprocess from 'svelte-preprocess'

...
  {
    /* svelte options */
    preprocess: sveltePreprocess({
      globalStyle: { ... },
      replace: { ... },
      typescript: { ... },
      scss: { ... },
      sass: { ... },
      less: { ... },
      stylus: { ... },
      postcss: { ... },
      coffeescript: { ... },
      pug: { ... },
    }),
  }
...
```

See the section below for options for each preprocessor.

##### Custom preprocessors

It's also possible to create custom preprocessors, taking advantage of the automatic language detection of `svelte-preprocess`:

```js
import sveltePreprocess from 'svelte-preprocess'

...
  {
    /* svelte options */
    preprocess: sveltePreprocess({
      aliases: [
        ['potato', 'potatoLanguage'],
        ['pot', 'potatoLanguage'],
      ],
      /** Add a custom language preprocessor */
      potatoLanguage({ content, filename, attributes }) {
        const { code, map } = require('potato-language').render(content);

        return { code, map };
      },
    }),
  }
...
```

Now `svelte-preprocess` will use the `potatoLanguage` preprocessor whenever it finds a tag with `lang="potato"`, `type="text/potatoLanguage"` or `src="./index.pot"`.

These methods receive the same arguments and act exactly like a [common svelte preprocessor](https://svelte.dev/docs#svelte_preprocess), but the concept of `markup`/`style`/`script` is abstracted as they are executed whenever `svelte-preprocess` find the aforementioned attributes.

### Stand-alone processors

In case you want to manually configure your preprocessing step while taking advantage of `svelte-preprocess` features, such as language detection and external file support, the following preprocessors are available: `pug`, `coffeescript`, `typescript`, `less`, `scss`, `sass`, `stylus`, `postcss`, `babel`, `globalStyle` `replace`.

Every processor accepts an option object which is passed to its respective underlying tool. See the section below for options for each preprocessor.

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

Stand-alone markup preprocessors such as `pug` are executed over the whole markup and not only inside a custom tag.

The preprocessors are language aware, which means you can enqueue multiple ones and you won't have `scss` and `stylus` conflicting over the same content.

## Preprocessors

Besides the options of each preprocessors, `svelte-preprocess` also supports these custom options:

| Option        | Default | Description                                                                            |
| ------------- | ------- | -------------------------------------------------------------------------------------- |
| `prependData` | `''`    | `string` will be prepended to every component part that runs through the preprocessor. |

### `babel`

The `babel` preprocessor accepts an option object which is passed onto the babel runtime. You can check the [`babel` API reference](https://babeljs.io/docs/en/options#primary-options) for specific options.

**Note**: `Svelte` expects your Javascript to be in at least ES6 format, so make sure to set your `babel` configuration accordingly.

_Note: If you want to transpile your app to be supported in older browsers, you must run babel from the context of your bundler._

### `coffeescript`

The `coffeescript` processor accepts no extra options and only transpiles Coffeescript code down to esm compliant Javascript code.

### `globalStyle`

The `globalStyle` preprocessor extends the functionalities of Svelte's `:global` pseudo selector.

**`global` attribute:**

Add a `global` attribute to your `style` tag and instead of scoping the CSS, all of its content will be interpreted as global style.

```html
<style global>
  div {
    color: red;
  }
</style>
```

**`:global` rule:**

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

_Note<sup>4</sup>: if you need to have some styles be scoped inside a global style tag, use `:local` in the same way you'd use `:global`._

### `less`

You can check the [`less` API reference](http://lesscss.org/usage/#less-options) for `less` specific options.

### `postcss`

The `postcss` preprocessor accepts three options:

| Option    | Default     | Description                                      |
| --------- | ----------- | ------------------------------------------------ |
| `plugins` | `undefined` | a list of `postcss plugins`.                     |
| `parser`  | `undefined` | the name of the module to be used as the parser. |
| `syntax`  | `undefined` | the syntax to be used.                           |

**Note**: In auto-preprocessing mode, you can set `postcss: true` if `postcss-load-config` is installed and `svelte-preprocess` will look for a `postcss` config file in your project.

You can check the [`postcss` API reference](https://api.postcss.org/) for `postcss` specific options.

### `pug`

You can check the [`pug` API reference](https://pugjs.org/api/reference.html) for more options. The only overriden property is `doctype`, which is set to `html`.

**Template blocks:**

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

**Element attributes:**

Pug encodes everything inside an element attribute to html entities, so `attr="{foo && bar}"` becomes `attr="foo &amp;&amp; bar"`. To prevent this from happening, instead of using the `=` operator use `!=` which won't encode your attribute value:

```pug
button(disabled!="{foo && bar}")
```

**Svelte Element directives:**

Syntax for use Svelte Element directives with Pug

```pug
input(bind:value="{foo}")
input(on:input="{bar}")
```

### `replace`

The `replace` preprocessor replaces a set of string patterns in your components markup defined by an array of `[RegExp, ReplaceFn | string]` tuples, the same arguments received by the `String.prototype.replace` method.

For example, to add a `process.env.{prop}` value resolution and a custom `@if/@endif` if-block shorthand, one could do:

```js
import svelte from 'rollup-plugin-svelte'

import { replace } from 'svelte-preprocess'

export default {
  plugins: [
    svelte({
      preprocess: [replace([
        [
          /process\.env\.(\w+)/g,
          (_:, prop) => JSON.stringify(process.env[prop]),
        ],
        // Example of supporting a blade-like syntax:
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
      ])]
    })
  ]
}
```

Allowing to write your component like:

```
@if(process.env.NODE_ENV !== 'development')
  <h1>Production environment!</h1>
@endif
```

And the result, with a `NODE_ENV = 'production'` would be:

```svelte
{#if "production" !== 'development'}
  <h1>Production environment!</h1>
{/if}
```

### `scss/sass`

The `scss/sass` preprocessor accepts the default sass options alongside two other props:

| Option           | Default     | Description                                                                                                                      |
| ---------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `renderSync`     | `false`     | if `true`, use the sync render method which is faster for dart sass.                                                             |
| `implementation` | `undefined` | pass the module to use to compile sass, if unspecified, `svelte-preprocess` will first look for `node-sass` and then for `sass`. |

You can check the [`sass` API reference](https://sass-lang.com/documentation/js-api) for specific `sass` options. The `file` and `data` properties are not supported.

**Note**: When `svelte-preprocess` detects the language as `sass`, it automatically sets `indentedSyntax` to `true.

### `stylus`

You can check the [`stylus` API reference](https://stylus-lang.com/docs/js.html) for specific `stylus` options. The `filename` is not supported.

```js
import svelte from 'rollup-plugin-svelte'

import { stylus } from 'svelte-preprocess'

export default {
  ...
  plugins: [
    svelte({
      preprocess: [
        stylus({ ... }),
      ]
    })
  ]
}
```

### `typescript`

| Option              | Default     | Description                                                                                                 |
| ------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `tsconfigDirectory` | `undefined` | optional `string` that specifies from where to load the tsconfig from.<br><br>i.e `'./configs'`             |
| `tsconfigFile`      | `undefined` | optional `string` pointing torwards a `tsconfig` file.<br><br>i.e `'./tsconfig.app.json'`                   |
| `compilerOptions`   | `undefined` | optional compiler options configuration. These will be merged with options from the tsconfig file if found. |

You can check te [`compilerOptions` reference](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) for specific `typescript` options.

Since `v4`, `svelte-preprocess` doesn't type-check your component, its only concern is to transpile it into valid Javascript for the compiler. If you want to have your components type-checked, you can use [svelte-check](https://github.com/sveltejs/language-tools/blob/master/packages/svelte-check/README.md).

As we're only transpiling, it's not possible to import types or interfaces into your svelte component without using the new TS 3.8 `type` import modifier: `import type { SomeInterface } from './MyModule'` otherwise bundlers will complain that the name is not exported by `MyModule`.

## Difference between the auto and stand-alone modes

The auto preprocessing mode is the recommended way of using `svelte-preprocess` as it's the least verbose and most straightforward way of supporting multiple language preprocessors.

`svelte-preprocess` was built in a way that the underlying transpilers and compilers are only required/imported if a portion of your component matches its language. With that said, the auto-preprocessing mode is roughly equivalent to using all the stand-alone preprocessors in the following order:

```js
import svelte from 'rollup-plugin-svelte';
import {
  pug,
  coffeescript,
  typescript,
  less,
  scss,
  sass,
  stylus,
  postcss,
  globalStyle,
  babel,
  replace,
} from 'svelte-preprocess';

export default {
  plugins: [
    svelte({
      preprocess: [
        replace(),
        pug(),
        coffeescript(),
        typescript(),
        less(),
        scss(),
        sass(),
        stylus(),
        babel(),
        postcss(),
        globalStyle(),
      ],
    }),
  ],
};

// vs
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

export default {
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
    }),
  ],
};
```
