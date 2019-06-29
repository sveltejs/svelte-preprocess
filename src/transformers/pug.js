const pug = require('pug')

// Mixins to use svelte template features
const MIXINS = `
mixin if(condition)
  | {#if !{condition}}
  block
  | {/if}

mixin else
  | {:else}
  block

mixin elseif(condition)
  | {:else if !{condition}}
  block

mixin each(loop)
  | {#each !{loop}}
  block
  | {/each}

mixin await(promise)
  | {#await !{promise}}
  block
  | {/await}

mixin then(answer)
  | {:then !{answer}}
  block

mixin catch(error)
  | {:catch !{error}}
  block

mixin debug(variables)
  | {@debug !{variables}}`

module.exports = ({ content, filename, options }) => {
  options = {
    doctype: 'html',
    filename,
    ...options,
  }

  const code = pug.render(`${MIXINS}\n${content}`, options)
  return { code }
}
