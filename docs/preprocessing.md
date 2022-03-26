# Preprocessing

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=3 orderedList=false} -->

<!-- code_chunk_output -->

- [Preprocessor Modes](#preprocessor-modes)
  - [Auto Preprocessing](#auto-preprocessing)
  - [Stand-alone processors](#stand-alone-processors)
  - [Difference between the auto and stand-alone modes](#difference-between-the-auto-and-stand-alone-modes)
- [Preprocessors](#preprocessors)
  - [Babel](#babel)
  - [CoffeeScript](#coffeescript)
  - [Less](#less)
  - [PostCSS, SugarSS](#postcss-sugarss)
  - [Pug](#pug)
  - [scss, sass](#scss-sass)
  - [Stylus](#stylus)
  - [TypeScript](#typescript)
  - [`globalStyle`](#globalstyle)
  - [`replace`](#replace)

<!-- /code_chunk_output -->

`svelte-preprocess` can be used in two ways: _auto-preprocessing_ and with _stand-alone_ processors.

The examples below are going to be using a hypothetical `rollup.config.js`, but `svelte-preprocess` can be used in multiple scenarios, see "[Usage](/docs/usage.md)".

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

As `svelte-preprocess` is just a Svelte preprocessor like any other, it's also possible to use it alongside other preprocessors:

```js
import svelte from 'rollup-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess'

export default {
  plugins: [
    svelte({
      preprocess: [
        sveltePreprocess({ ... }),
        mdsvex({ ... })
      ]
    })
  ]
}
```

#### Auto preprocessing options

The following options can be passed to the preprocessor. None are required:

| Option          | Default      | Description                                                                                                                                                                                                                        |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `markupTagName` | `"template"` | `string` that sets the name of the tag `svelte-preprocess` looks for markup in custom languages.<br><br>i.e `markup` makes it possible to write your markup between `<markup lang="..."></markup>` tag.                            |
| `aliases`       | `null`       | A list of tuples `[alias: string, language: string]` that correlates an `alias` to a `language`<br><br>i.e `['cst', 'customLanguage']` means<br>`<... src="./file.cst">`<br>`<... lang="cst">`<br>are treated as `customLanguage`. |
| `preserve`      | `[]`         | A `string` list of languages/aliases that shouldn't pass through the preprocessor. (i.e `ld+json`)                                                                                                                                 |
| `sourceMap`     | `false`      | If `true`, `svelte-preprocess` generates sourcemap for every language that supports it.                                                                                                                                            |

##### Configuring preprocessors

Alongside the options above, you can also configure options of specific preprocessors:

```js
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

export default {
  plugins: [
    svelte({
      preprocess: sveltePreprocess({
        globalStyle: { ... },
        replace: { ... },
        typescript: { ... },
        scss: { ... },
        sass: { ... },
        less: { ... },
        stylus: { ... },
        babel: { ... },
        postcss: { ... },
        coffeescript: { ... },
        pug: { ... },
      }),
    }),
  ],
};
```

See the section below for options for each preprocessor.

##### Custom preprocessors

It's also possible to create custom preprocessors, taking advantage of the automatic language detection of `svelte-preprocess`:

```js
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

export default {
  plugins: [
    svelte({
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
    }),
  ],
};
```

Now `svelte-preprocess` will use the `potatoLanguage` preprocessor whenever it finds a tag with `lang="potato"` or `src="./index.pot"`.

These methods receive the same arguments and act exactly like a [common svelte preprocessor](https://svelte.dev/docs#svelte_preprocess), but the concept of `markup`/`style`/`script` is abstracted as they are executed whenever `svelte-preprocess` find the aforementioned attributes.

##### Overriding preprocessors

We've seen that we can easily create custom preprocessors within `svelte-preprocess`, but wait, there's more! Using the same mechanism, it's possible to override the default preprocessor for a language!

Let's use TypeScript as an example. The `tsc` compiler is fast enough at the beginning, but as a project grows, it can really become cumbersome. `esbuild` is a JavaScript bundler written in Go and can transpile TypeScript [much faster](https://github.com/evanw/esbuild#benchmarks) than our good and old `tsc`.

To integrate `esbuild` with `svelte-preprocess` we can override the default TypeScript preprocessor as follows:

```js
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import { transformSync } from 'esbuild';

export default {
  plugins: [
    svelte({
      preprocess: sveltePreprocess({
        typescript({ content }) {
          const { code, map } = transformSync(content, {
            loader: 'ts',
          });
          return { code, map };
        },
      }),
    }),
  ],
};
```

### Stand-alone processors

In case you want to manually configure your preprocessing step while taking advantage of `svelte-preprocess` features, such as language detection and external file support, the following preprocessors are available: Pug, CoffeeScript, TypeScript, Less, SCSS, Sass, Stylus, PostCSS, Babel, `globalStyle`, and `replace`.

Every processor accepts an options object which is passed to its respective underlying tool. See the section below for options for each preprocessor.

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

Stand-alone markup preprocessors such as Pug are executed over the whole markup and not only inside a custom tag.

The preprocessors are language-aware, which means you can enqueue multiple ones and you won't have SCSS and Stylus conflicting over the same content.

### Difference between the auto and stand-alone modes

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
        replace({ ... }),
        pug({ ... }),
        coffeescript({ ... }),
        typescript({ ... }),
        less({ ... }),
        scss({ ... }),
        sass({ ... }),
        stylus({ ... }),
        babel({ ... }),
        postcss({ ... }),
        globalStyle({ ... }),
      ],
    }),
  ],
};
```

## Preprocessors

Besides the options of each preprocessor, `svelte-preprocess` also supports these custom options:

| Option        | Default | Description                                                                            |
| ------------- | ------- | -------------------------------------------------------------------------------------- |
| `prependData` | `''`    | `string` will be prepended to every component part that runs through the preprocessor. |

### Babel

The Babel preprocessor accepts an options object which is passed onto the babel runtime. You can check the [Babel API reference](https://babeljs.io/docs/en/options#primary-options) for specific options.

`Svelte` expects your JavaScript to be in at least ES6 format, so make sure to set your Babel configuration accordingly.

_Note: If you want to transpile your app to be supported in older browsers, you must run babel from the context of your bundler._

### CoffeeScript

You can set sourceMap:true to enable sourceMap.

If the parameter label:true is set, the [@rmw/coffee-label-patch](https://github.com/rmw-lib/coffee-label-patch) syntax patch will be enabled, allowing CoffeeScript to support label syntax.

### Less

You can check the [Less API reference](http://lesscss.org/usage/#less-options) for Less specific options.

Note: `svelte-preprocess` automatically configures inclusion paths for your root directory, `node_modules` and for the current file's directory.

### PostCSS, SugarSS

The PostCSS preprocessor accepts four options:

| Option           | Default     | Description                                                     |
| ---------------- | ----------- | --------------------------------------------------------------- |
| `plugins`        | `undefined` | a list of `postcss plugins`.                                    |
| `parser`         | `undefined` | the name of the module to be used as the parser.                |
| `syntax`         | `undefined` | the syntax to be used.                                          |
| `configFilePath` | `undefined` | the path of the directory containing the PostCSS configuration. |

In auto-preprocessing mode, you can set `postcss: true` if `postcss-load-config` is installed and `svelte-preprocess` will look for a PostCSS config file in your project.

When a `lang="sugarss"` is found, `sugarss` is automatically loaded and extra indentation is removed.

You can check the [PostCSS API reference](https://api.postcss.org/) for PostCSS specific options.

### Pug

You can check the [Pug API reference](https://pugjs.org/api/reference.html) for information about its options. The only overridden property is `doctype`, which is set to HTML.

Apart from those, the Pug preprocessor accepts:

| Option           | Default     | Description                                                                                                         |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `markupTagName`  | `template`  | the tag name used to look for the optional markup wrapper. If none is found, `pug` is executed over the whole file. |
| `configFilePath` | `undefined` | the path of the directory containing the PostCSS configuration.                                                     |

**Template blocks:**

Some of Svelte's template syntax is invalid in Pug. `svelte-preprocess` provides some pug mixins to represent svelte's `{#...}{/...}` blocks: `+if()`, `+else()`, `+elseif()`, `+each()`, `+key()`, `+await()`, `+then()`, `+catch()`, `+html()`, `+debug()`.

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

This is also necessary to pass callbacks:

```pug
button(on:click!="{(e) => doTheThing(e)}")
```

It is not possible to use template literals for attribute values. You can't write `` attr=`Hello ${value ? 'Foo' : 'Bar'}` ``, instead write `attr="Hello {value ? 'Foo' : 'Bar'}"`.

**Spreading props:**

To spread props into a pug element, wrap the `{...object}` expression with quotes `"`.

This:

```pug
button.big(type="button" disabled "{...slide.props}") Send
```

Becomes:

```svelte
<button class="big" type="button" disabled {...slide.props}>
  Send
</button>
```

**Svelte Element directives:**

Syntax to use Svelte Element directives with Pug

```pug
input(bind:value="{foo}")
input(on:input="{bar}")
```

### scss, sass

The `scss/sass` preprocessor accepts the default sass options alongside two other props:

| Option           | Default     | Description                                                                                                                    |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `renderSync`     | `false`     | if `true`, use the sync render method which is faster for dart sass.                                                           |
| `implementation` | `undefined` | pass the module to use to compile sass, if unspecified, `svelte-preprocess` will first look for `node-sass` and then for Sass. |

You can check the [Sass API reference](https://sass-lang.com/documentation/js-api) for specific Sass options. The `file` and `data` properties are not supported. Instead, use the `prependData` property if you want to prepend some content to your `scss` content.

Note: `svelte-preprocess` automatically configures inclusion paths for your root directory, `node_modules` and for the current file's directory.

Note: when a `lang="sass"` is found, `indentedSyntax` is automatically set to `true`.

Note: `sass`, with indented syntax, and `scss` are not interchangeable so make sure to configure the correct one that fits your needs.

### Stylus

You can check the [Stylus API reference](https://stylus-lang.com/docs/js.html) for specific Stylus options. The `filename` property is overridden.

Note: `svelte-preprocess` automatically configures inclusion paths for your root directory, `node_modules` and for the current file's directory.

### TypeScript

| Option               | Default     | Description                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsconfigDirectory`  | `undefined` | optional `string` that specifies from where to load the tsconfig from.<br><br>i.e `'./configs'`                                                                                                                                                                                                                                                                                             |
| `tsconfigFile`       | `undefined` | optional `string` pointing torwards a `tsconfig` file.<br><br>i.e `'./tsconfig.app.json'`                                                                                                                                                                                                                                                                                                   |
| `compilerOptions`    | `undefined` | optional compiler options configuration. These will be merged with options from the tsconfig file if found.                                                                                                                                                                                                                                                                                 |
| `handleMixedImports` | inferred    | optional `boolean` that defines the transpilation strategy. If set to `true`, you don't need to strictly separate types and values in imports. You need at least Svelte version 3.39 if you want to use this. `true` by default if you meet the minimum version requirement, else `false`. This option will be ignored if you set `preserveValueImports` to `true` in your `tsconfig.json`. |

You can check the [`compilerOptions` reference](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) for specific TypeScript options.

#### Typescript - Limitations

- Since `v4`, `svelte-preprocess` doesn't type-check your component, its only concern is to transpile it into valid JavaScript for the compiler. If you want to have your components type-checked, you can use [svelte-check](https://github.com/sveltejs/language-tools/blob/master/packages/svelte-check/README.md).

- Using TypeScript inside a component's markup is currently **not** supported. See [#318](https://github.com/sveltejs/svelte-preprocess/issues/318) for development updates to this.

### `globalStyle`

The `globalStyle` preprocessor extends the functionalities of Svelte's `:global` pseudo-selector.

First, install `postcss` by running `npm install --save-dev postcss`. Then use the rules below.

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

**Usage notes**

- If you're using it as a standalone processor, it works best if added to the end of the processors array.\_
- Wrapping `@keyframes` inside `:global {}` blocks is not supported. Use the [`-global-` name prefix for global keyframes](https://svelte.dev/docs#style).\_
- If you need to have some styles be scoped inside a global style tag, use `:local` in the same way you'd use `:global`.\_

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

> Note: a string can be used instead of a `RegExp`, but only a single occurence of it will change, as per the default behavior of `String.prototype.replace`.
