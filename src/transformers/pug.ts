import detectIndent from 'detect-indent';
import pug from 'pug';

import type { Transformer, Options } from '../types';

// Mixins to use svelte template features
const GET_MIXINS = (indentationType: 'tab' | 'space') =>
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

mixin const(expression)
%_| {@const !{expression}}

mixin debug(variables)
%_| {@debug !{variables}}`.replace(
    /%_/g,
    indentationType === 'tab' ? '\t' : '  ',
  );

const transformer: Transformer<Options.Pug> = async ({
  content,
  filename,
  options,
}) => {
  const pugOptions = {
    // needed so pug doesn't mirror boolean attributes
    // and prop spreading expressions.
    doctype: 'html',
    compileDebug: false,
    filename,
    ...options,
  };

  const { type: indentationType } = detectIndent(content);
  const input = `${GET_MIXINS(indentationType ?? 'space')}\n${content}`;
  const compiled = pug.compile(
    input,
    pugOptions,
    // @types/pug compile() returned value doesn't have `dependencies` prop
  ) as pug.compileTemplate & { dependencies?: string[] };

  let code: string;

  try {
    code = compiled();
  } catch (e) {
    // The error message does not have much context, add more of it
    if (e instanceof Error) {
      e.message = `[svelte-preprocess] Pug error while preprocessing ${filename}\n\n${e.message}`;
    }

    throw e;
  }

  return {
    code,
    dependencies: compiled.dependencies ?? [],
  };
};

export { transformer };
