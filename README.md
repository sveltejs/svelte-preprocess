# Svelte (Magical) Preprocess

> A magical and customizable [Svelte](https://svelte.technology) preprocessor with support for: SCSS, Less, Stylus, Coffeescript and Pug.

## Usage

### Basic

```js
const svelte = require('svelte')
const magicalPreprocess = require('svelte-preprocess')

svelte.preprocess(input, magicalPreprocess()).then(...)
```

### Advanced

```js
const svelte = require('svelte')
const magicalPreprocess = require('svelte-preprocess')
const magicOpts = {
  /** Transform the whole markup before preprocessing */
  onBefore({ content, filename }) {
    return content.replace('something', 'someotherthing')
  },
  languages: {
    /** Disable a language by setting it to 'false' */
    scss: false,

    /**  Pass options to the default preprocessor method */
    stylus: {
      paths: ['node_modules']
    },

    /** Use a custom preprocess method by passing a function. */
    pug(content, filename) {
        const code = pug.render(content)

        return { code, map: null }
    },

    /** Add a custom language preprocessor */
    customLanguage(content, filename) {
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

svelte.preprocess(input, magicalPreprocess(magicOpts)).then(...)
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