import detectIndent from 'detect-indent';
import pug from 'pug';

import type { Transformer, Options } from '../types';

// Mixins to use svelte template features
const GET_MIXINS = (identationType: 'tab' | 'space') =>
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

mixin key(expression)
%_| {#key !{expression}}
%_block
%_| {/key}

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

mixin html(expression)
%_| {@html !{expression}}

mixin debug(variables)
%_| {@debug !{variables}}`.replace(
    /%_/g,
    identationType === 'tab' ? '\t' : '  ',
  );

const transformer: Transformer<Options.Pug> = async ({
  content,
  filename,
  options,
}) => {
  const pugOptions = {
    doctype: 'html',
    compileDebug: false,
    filename,
    ...options,
  };

  const { type: identationType } = detectIndent(content);
  const code = `${GET_MIXINS(identationType)}\n${content}`;
  const compiled = pug.compile(
    code,
    pugOptions,
    // @types/pug compile() returned value doesn't have `dependencies` prop
  ) as pug.compileTemplate & { dependencies?: string[] };

  return {
    code: compiled(),
    dependencies: compiled.dependencies ?? null,
  };
};

export { transformer };
