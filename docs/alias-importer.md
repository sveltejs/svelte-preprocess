# Alias Importer Example

One of the features of the vite build sytem is the aliasing of import paths.
For example, you can provide a shortcut to the path of a css file in an import statement instead of the full path.

For example:
```html
<script>
  import "@styles/example1.css";
</script>

<style lang="scss">
  @import "@styles/example1";
</style>
```

There are some cases however where [this doesn't work](https://github.com/sveltejs/vite-plugin-svelte/issues/376)
such as the svelte:head section.
In this case @styles will not necessarily resolve to a path setup within the alias configuration.
```html
<svelte:head>
  <style lang="scss">
    @import "@styles/example1";
  </style>
</svelte:head>
```

One example of where svelte:head can be useful is where you want global styles to be
[unloaded when switching between components](https://github.com/sveltejs/svelte/issues/5530).
Typically, this can be useful when writing storybookjs pages.

To work around this there are a couple of approaches.
The first is to use the experimental useVitePreprocess option for the vite-svelte plugin.

```json
  plugins: [
    svelte({
      experimental: {
        useVitePreprocess: true
      }
    })
  ],
```

This option doesn't always work with systems such as storybook however, in those situations we can use the svelte-preprocess to handle the alias's as a workaround.


## Creating a list of alias's

First we're going to write a file called alias.cjs.
This will contain a list of the alias's that we can pass to vite and a function we can pass to svelte-preprocess at the same time.

Typically, vite svelte projects such as sveltekit tend to be of the `module` type, which means javascript defaults to ES6 / ESModules. Since we may want to use this file from storybook (which uses CommonJS) we write it in the form of a CommonJS module with a ".cjs" extension.

`src/alias.cjs`
```js
const path = require('path');
const rootdir = path.resolve(path.dirname(__filename) + '/..');

/**
 * A list of alias's that can be fed into the vite configuration
 * and can be used by the importer function below
 */
alias_vite_setts = {
    '/@': path.resolve(rootdir),
    '~': path.resolve(rootdir + '/node_modules'),
    '@styles': path.resolve(rootdir + '/src/styles'),
};
exports.alias_vite_setts = alias_vite_setts;

/**
 * An importer function that we can pass to svelte-preprocess
 */
exports.alias_vite_importer = () => {
    return url => {
        // Sort the entries by longest first, so @style2 would be picked up before @style
        let entries = Object.entries(alias_vite_setts).sort(([, a]) => -a.length);
        // Iterate over the alias entries
        for (const [alias, aliasPath] of entries) {
            if (url.indexOf(alias) === 0) {
                return {
                    file: path.resolve(url.replace(alias, aliasPath)),
                };
            }
        }
        return url;
    };
};
```


## Vite Configuration

Next we're going to configure vite.
This setup is fairly simple, we're just importing the settings directly into vite.
If you've selected a typescript based template when creating the svelte project, then it may be best to rename `vite.config.ts` to `vite.config.js` to make importing CommonJS modules easier.

`vite.config.js`
```js
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { alias_vite_setts } from './src/alias.cjs'

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: alias_vite_setts,
  },
})
```

## Svelte Configuration

Next we're going to configure svelte-preprocess, here we're enabling the **postcss** option and passing in the import function for scss import resolving.

`svelte.config.js`
```js
import sveltePreprocess from 'svelte-preprocess';
import { alias_vite_importer } from './src/alias.cjs'

export default {
	preprocess: [
		sveltePreprocess({
		    postcss: true,
			  scss: {
				  importer: [alias_vite_importer()],
			},
		}),
	],
}
```

## StoryBook Configuration

For storybook we can also import the same settings / callback function here as well.
Since storybook uses CommonJS we need to rename its configuration to `/storybook/main.cjs`
so that it will be interpreted as a CommonJS and not a ES6 module within the project

The configuration will look something like this:

`/storybook/main.cjs`
```js
const sveltePreprocess = require('svelte-preprocess');
const { mergeConfig } = require('vite');
const _alias = require('../src/alias.cjs');

module.exports = {
    stories: [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx|svelte)"
  ],
  addons: [

    ...

    "@storybook/preset-scss",
    "@storybook/addon-svelte-csf",
    {
      name: '@storybook/addon-postcss',
      options: {
          postcssLoaderOptions: {
              implementation: require('postcss')
          }
      }
    }
  ],
  framework: "@storybook/svelte",
  core: {
    builder: "@storybook/builder-vite"
  },
  svelteOptions: {
    preprocess: [
      sveltePreprocess({
          postcss: true,
          scss: {
            importer: [_alias.alias_vite_importer()],
          },
      }),
    ],
  },
  features: {
    storyStoreV7: true
  },
  async viteFinal(config, { configType }) {
    // return the customized config
    return mergeConfig(config, {
      // customize the Vite config here
      resolve: {
        alias: _alias.alias_vite_setts
      },
    });
  },
}
```

## VSCode IDE

To help out Visual Studio Code we can also create a **jsconfig.json** file to help resolve the alias's

`jsconfig.json`
```json
// jsconfig.json
{
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"/@": ["./"],
			"~": ["./node_modules"],
			"@styles": ["./src/styles"]
		}
	},
	"include": ["./src/**/*.d.ts", "./src/**/*.js", "./src/**/*.svelte"]
}
```
