# Svelte Smart Preprocess (WIP)

> A smart svelte preprocessor wrapper

## Usage

```js
const preprocessOptions = smartPreprocess({
  [language]: false | true | fn(content,filename): { code, map }
})

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

## Example

```js
  const svelte = require('svelte')
  const smartPreprocess = require('svelte-smart-preprocess')

  const input = '...'

  const preprocessOptions = smartPreprocess({
    /** Use included scss compiler */
    scss: true
    /**
     * Pass a function which returns an object { code, map }
     * or a promise that resolves to one.
     */
    pug: function (content, filename, options) {
      const code = pug.render(content)

      return { code, map: null }
    }
  })

  svelte.preprocess(input, preprocessOptions).then(...)
```
