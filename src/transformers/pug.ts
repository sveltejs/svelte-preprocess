import detectIndent from 'detect-indent';
import pug from 'pug';

import { Transformer, Options } from '../types';

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
  );

const transformer: Transformer<Options.Pug> = async ({
  content,
  filename,
  options,
}) => {
  options = {
    doctype: 'html',
    filename,
    ...options,
  };

  const { type: identationType } = detectIndent(content);
  const code = `${GET_MIXINS(identationType)}\n${content}`;
  const compiled = pug.compile(code, {
    compileDebug: false,
    filename,
    ...options,
    // @types/pug compile() returned value doesn't have `dependencies` prop
  }) as pug.compileTemplate & { dependencies?: string[] };

  return {
    code: compiled(),
    dependencies: compiled.dependencies ?? null,
  };
};

export default transformer;
