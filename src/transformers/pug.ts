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

  const spaces = guessIndentString(content);
  const input = `${GET_MIXINS(spaces ? 'space' : 'tab')}\n${content}`;
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

// Sourced from `golden-fleece`
// https://github.com/Rich-Harris/golden-fleece/blob/f2446f331640f325e13609ed99b74b6a45e755c2/src/patch.ts#L302
function guessIndentString(str: string): number | undefined {
  const lines = str.split('\n');

  let tabs = 0;
  let spaces = 0;
  let minSpaces = 8;

  lines.forEach((line) => {
    const match = /^(?: +|\t+)/.exec(line);

    if (!match) return;

    const [whitespace] = match;

    if (whitespace.length === line.length) return;

    if (whitespace[0] === '\t') {
      tabs += 1;
    } else {
      spaces += 1;
      if (whitespace.length > 1 && whitespace.length < minSpaces) {
        minSpaces = whitespace.length;
      }
    }
  });

  if (spaces > tabs) {
    let result = '';

    while (minSpaces--) result += ' ';

    return result.length;
  }
}

export { transformer };
