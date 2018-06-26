# Svelte Preprocess

> A [Svelte](https://svelte.technology) preprocessor wrapper with support for: PostCSS, SCSS, Less, Stylus, Coffeescript and Pug.

## Installation

`npm install --save-dev svelte-preprocess`

The preprocessor module installation is up to the developer since we don't have a `optionalPeerDependencies`.

- `postcss`: `npm install --save-dev postcss`
- `coffeescript`: `npm install --save-dev coffeescript`
- `less`: `npm install --save-dev less`
- `sass`: `npm install --save-dev node-sass`
- `pug`: `npm install --save-dev pug`
- `stylus`: `npm install --save-dev stylus`

## Usage

### Basic

```js
const svelte = require('svelte')
const preprocess = require('svelte-preprocess')

svelte.preprocess(input, preprocess({ /* options */ })).then(...)
```

### Advanced

```js
const svelte = require('svelte')
const preprocess = require('svelte-preprocess')
const options = {
  /** Transform the whole markup before preprocessing */
  onBefore({ content, filename }) {
    return content.replace('something', 'someotherthing')
  },
  transformers: {
    /** Disable a language by setting it to 'false' */
    scss: false,

    /** Enable a language's default transformer by setting it to 'true' */
    less: true,

    /**  Pass options to the default preprocessor method */
    stylus: {
      paths: ['node_modules']
    },

    /**
     * Post process css with PostCSS by defining 'transformers.postcss'
     * Pass 'true' to activate PostCSS transforms and use the `postcss.config.js`
     */
    postcss: true,
    postcss: {
      plugins: [
        require('autoprefixer')({ browsers: 'last 2 versions' })
      ]
    },

    /** Use a custom preprocess method by passing a function. */
    pug({ content, filename }) {
        const code = pug.render(content)

        return { code, map: null }
    },

    /** Add a custom language preprocessor */
    customLanguage({ content, filename }) {
      const { code, map } = require('custom-language-compiler')(content)
      return { code, map }
    }
  },
  /**
   * Extend the default language alias dictionary.
   * Each entry must follow: ['alias', 'languageName']
   */
  aliases: [
    /**
     * Means
     * <... src="file.cst"> or
     * <... lang="cst"> or
     * <... type="text/customLanguage">
     * will be treated as the language 'customLanguage'
    */
    ['cst', 'customLanguage']
  ],
}

svelte.preprocess(input, preprocess(options)).then(...)
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

## Features

### Template (a la Vue) tag support

```html
<template>
  <div>Hey</div>
</template>

<style></style>

<script></script>
```

## External files support

```html
<template src="template.html"></template>
<script src="./script.js"></script>
<style src="./style.css"></style>
```

## Preprocessors support

Current supported out-of-the-box preprocessors are `SCSS`, `Stylus`, `Less`, `Coffeescript`, `Pug`.

```html

<template lang="pug">
  div Hey
</template>

<script type="text/coffeescript">
  export default
    methods:
      foo: () ->
        console.log('Hey')
</script>

<style src="./style.scss"></style>

<!-- Or -->

<style src="./style.styl"></style>

<!-- Or -->

<style lang="scss">
  $color: red;
  div {
    color: $color;
  }
</style>

<!-- Or -->

<style type="text/stylus">
  $color = red

  div
    color: $color
</style>
```
