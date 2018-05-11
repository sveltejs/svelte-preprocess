# Svelte Smart Preprocess (WIP)

> A smart svelte preprocessor wrapper baked with SCSS, Less, Stylus, Coffeescript and Pug support.

## Usage

```js
const smartOpts = {
  /** Transform the whole markup before preprocessing */
  onBefore({ content,filename }) {
    return content.replace('something', 'someotherthing')
  },
  languages: {
    /** Disable a language by setting it to 'false' */
    scss: false,

    /**  Pass options to the default preprocessor an object */
    stylus: {
      paths: ['node_modules']
    },

    /** Use a custom preprocess method by passing a function. */
    pug(content, filename) {
        const code = pug.render(content)

        return { code, map: null }
      }
  }
}

const preprocessOptions = smartPreprocess(smartOpts)
svelte.preprocess(input, preprocessOptions).then(...)
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
<div>Hey</div>

<style src="./style.scss"></style>

<style src="./style.styl"></style>

<style lang="scss">
  $color: red;
  div {
    color: $color;
  }
</style>

<style type="text/stylus">
  $color = red

  div
    color: $color
</style>
```