const detectIndent = require('detect-indent')
const pug = require('pug')

// Mixins to use svelte template features
const GET_MIXINS = identationType =>
  `mixin if(condition)
%_| {#if !{condition}}
%_block
%_| {/if}

mixin else
%_| {:else}
%_block

mixin elseif(condition)
%_| {:else if !{condition}}
%_block

mixin each(loop)
%_| {#each !{loop}}
%_block
%_| {/each}

mixin await(promise)
%_| {#await !{promise}}
%_block
%_| {/await}

mixin then(answer)
%_| {:then !{answer}}
%_block

mixin catch(error)
%_| {:catch !{error}}
%_block

mixin debug(variables)
%_| {@debug !{variables}}`.replace(
    /%_/g,
    identationType === 'tab' ? '\t' : '  ',
  )

module.exports = ({ content, filename, options }) => {
  options = {
    doctype: 'html',
    filename,
    ...options,
  }

  const { type: identationType } = detectIndent(content)
  const code = pug.render(`${GET_MIXINS(identationType)}\n${content}`, options)
  return { code }
}
