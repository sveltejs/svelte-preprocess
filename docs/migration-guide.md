# Migration Guide

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Migration Guide](#migration-guide)
- [From `v3` to `v4`](#from-v3-to-v4)
  - [Prepending content to `scss`](#prepending-content-to-scss)
  - [Executing some function before preprocessing](#executing-some-function-before-preprocessing)
  - [Defining preprocessor properties](#defining-preprocessor-properties)
  - [Type-checking components](#type-checking-components)

<!-- /code_chunk_output -->

## From `v3` to `v4`

### Prepending content to `scss`

In `v3`, it was possible to prepend some content for the `scss` language through the `data` property.

```js
import sveltePreprocess from 'svelte-preprocess';

sveltePreprocess({
  scss: {
    data: '// prepended content',
  },
});
```

In `v4`, not only `scss`, but every language preprocessor accepts the new `prependData` property. The `data` property is no longer supported.

```js
import sveltePreprocess from 'svelte-preprocess';

sveltePreprocess({
  scss: {
    prependData: '// prepended content for scss',
  },
  typescript: {
    prependData: '// prepended content for ts',
  },
});
```

### Executing some function before preprocessing

The previously `onBefore` property was removed. Instead, enqueue a custom preprocessor before `svelte-preprocess`.

```js
// v3

{
  preprocess: sveltePreprocess({
    onBefore({ content, filename }) {
      return content.replace('foo', 'bar');
    },
  });
}

// v4
const myPreprocessor = {
  markup({ content }) {
    return { code: content.replace('foo', 'bar') };
  },
};

// later in your config
{
  preprocess: [myPreprocessor, sveltePreprocess()];
}
```

### Defining preprocessor properties

The previously `transformers` property was removed. Instead, define your preprocessor options in the root object of `svelte-preprocess` auto-preprocessor.

```diff
import sveltePreprocess from 'svelte-preprocess';

sveltePreprocess({
-  transformers: {
     scss: { ... }
-  }
});
```

### Type-checking components

> TODO
