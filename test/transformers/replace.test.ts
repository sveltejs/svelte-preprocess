import autoProcess from '../../src';
import { preprocess } from '../utils';
import { describe, it, expect } from 'vitest';
import {
  TraceMap,
  originalPositionFor,
  sourceContentFor,
} from '@jridgewell/trace-mapping';
import { replace } from '../../src/processors/replace';
import type { Options } from '../../src/types';

const options: Options.Replace = [
  [/@if\s*\((.*?)\)$/gim, '{#if $1}'],
  [/@elseif\s*\((.*?)\)$/gim, '{:else if $1}'],
  [/@else$/gim, '{:else}'],
  [/@endif$/gim, '{/if}'],
  [/@each\s*\((.*?)\)$/gim, '{#each $1}'],
  [/@endeach$/gim, '{/each}'],
  [/@await\s*\((.*?)\)$/gim, '{#await $1}'],
  [/@then\s*(?:\((.*?)\))?$/gim, '{:then $1}'],
  [/@catch\s*(?:\((.*?)\))?$$/gim, '{:catch $1}'],
  [/@endawait$/gim, '{/await}'],
  [/@debug\s*\((.*?)\)$/gim, '{@debug $1}'],
  [/@html\s*\((.*?)\)$/gim, '{@html $1}'],
];

describe('transformer - regex', () => {
  it('maps unchanged content after multiline and sequential replacements', async () => {
    const input = 'first\n@name\nlast';
    const result = await replace([
      [/@name/, 'very\nlong'],
      [/long/, 'longer'],
    ]).markup!({ content: input, filename: 'Component.svelte' });

    expect(result?.code).toBe('first\nvery\nlonger\nlast');
    const map = new TraceMap(result!.map as any);

    expect(originalPositionFor(map, { line: 4, column: 0 })).toMatchObject({
      source: 'Component.svelte',
      line: 3,
      column: 0,
    });
    expect(sourceContentFor(map, 'Component.svelte')).toBe(input);
  });

  it('keeps native replacement semantics for captures, callbacks and empty matches', async () => {
    const input = 'a-1\nb-2\nuntouched';
    const replacements: Options.Replace = [
      [/(?<letter>[ab])-(\d)/g, '$<letter>:$2'],
      [/(?=b)/g, 'prefix-'],
      [/:(\d)/g, (_, digit: string) => `=${Number(digit) + 1}`],
    ];

    const expected = replacements.reduce(
      (value, [pattern, substitution]) =>
        value.replace(pattern, substitution as any),
      input,
    );

    const result = await replace(replacements).markup!({
      content: input,
      filename: 'Component.svelte',
    });

    expect(result?.code).toBe(expected);
    const map = new TraceMap(result!.map as any);

    expect(originalPositionFor(map, { line: 3, column: 0 })).toMatchObject({
      source: 'Component.svelte',
      line: 3,
      column: 0,
    });
  });

  it('matches native replacement tokens and callback arguments', async () => {
    const input = 'left x right';
    const replacements: Options.Replace = [
      [/(x)/, "$$:$&:$`:$':$1:$2:$01:$12"],
      [
        /(?<word>right)/,
        (_: string, ...args: unknown[]) => {
          const [word, offset, full, groups] = args as [
            string,
            number,
            string,
            Record<string, string>,
          ];

          return `${groups.word}-${word}-${offset}-${full.length}`;
        },
      ],
    ];

    const expected = replacements.reduce(
      (value, [pattern, substitution]) =>
        value.replace(pattern, substitution as any),
      input,
    );

    const result = await replace(replacements).markup!({
      content: input,
      filename: 'Component.svelte',
    });

    expect(result?.code).toBe(expected);
  });

  it('keeps CRLF and Unicode positions and omits a map when nothing changes', async () => {
    const input = '🌿 one\r\n@name\r\n🌿 after';
    const result = await replace([[/@name/, 'two\r\nthree']]).markup!({
      content: input,
      filename: 'Component.svelte',
    });

    expect(result?.code).toBe('🌿 one\r\ntwo\r\nthree\r\n🌿 after');
    const map = new TraceMap(result!.map as any);

    expect(originalPositionFor(map, { line: 4, column: 0 })).toMatchObject({
      source: 'Component.svelte',
      line: 3,
      column: 0,
    });

    const unchanged = await replace([[/missing/, 'unused']]).markup!({
      content: input,
      filename: 'Component.svelte',
    });

    expect(unchanged?.code).toBe(input);
    expect(unchanged?.map).toBeUndefined();
  });

  it('preserves the replacement map in automatic markup preprocessing', async () => {
    const input = '<script>let value = 1;</script>\n@name\n<p>after</p>';
    const processed = await preprocess(
      input,
      autoProcess({ replace: [[/@name/, '<p>new</p>']] }),
    );

    expect(processed.code).toBe(
      '<script>let value = 1;</script>\n<p>new</p>\n<p>after</p>',
    );
    const map = new TraceMap(processed.map as any);

    expect(originalPositionFor(map, { line: 3, column: 0 })).toMatchObject({
      line: 3,
      column: 0,
    });
  });

  it('maps content after a template wrapper is removed', async () => {
    const input =
      '<template><p>before</p>\n@name\n<p>after</p></template><script>let x = 1;</script>';

    const processed = await preprocess(
      input,
      autoProcess({ replace: [[/@name/, '<p>new</p>']] }),
    );

    expect(processed.code).toBe(
      '<p>before</p>\n<p>new</p>\n<p>after</p><script>let x = 1;</script>',
    );
    const map = new TraceMap(processed.map as any);

    expect(originalPositionFor(map, { line: 1, column: 0 })).toMatchObject({
      line: 1,
      column: 10,
    });
    expect(originalPositionFor(map, { line: 3, column: 0 })).toMatchObject({
      line: 3,
      column: 0,
    });
    expect(originalPositionFor(map, { line: 3, column: 12 })).toMatchObject({
      line: 3,
      column: 23,
    });
  });

  it('replaces string patterns in markup with string patterns', async () => {
    const template = `
<script>
  let foo = 1
</script>

@debug(foo)
@html(foo)

@if (foo && bar)
    <div>hey</div>
@elseif (baz < 0 && (baz || bar))
    <div>yo</div>
@endif

@each(expression as name, index (key))
    <li>foo</li>
@else
    <div>foo</div>
@endeach

@await(promise)
    awaiting
@then
    then
@then(value)
    then value
@catch
    catch
@endawait`
      .trim()
      .repeat(2);

    const opts = autoProcess({ replace: options });
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString?.()).toMatchInlineSnapshot(`
      "<script>
        let foo = 1
      </script>

      {@debug foo}
      {@html foo}

      {#if foo && bar}
          <div>hey</div>
      {:else if baz < 0 && (baz || bar)}
          <div>yo</div>
      {/if}

      {#each expression as name, index (key)}
          <li>foo</li>
      {:else}
          <div>foo</div>
      {/each}

      {#await promise}
          awaiting
      {:then }
          then
      {:then value}
          then value
      {:catch }
          catch
      @endawait<script>
        let foo = 1
      </script>

      {@debug foo}
      {@html foo}

      {#if foo && bar}
          <div>hey</div>
      {:else if baz < 0 && (baz || bar)}
          <div>yo</div>
      {/if}

      {#each expression as name, index (key)}
          <li>foo</li>
      {:else}
          <div>foo</div>
      {/each}

      {#await promise}
          awaiting
      {:then }
          then
      {:then value}
          then value
      {:catch }
          catch
      {/await}"
    `);
  });

  it('replaces string patterns in markup by using a method', async () => {
    const template = `<script>
      let isDEV = process.env.NODE_ENV === 'development';
    </script>`;

    const opts = autoProcess({
      replace: [
        [
          /process\.env\.(\w+)/g,
          (_: string, match: string) => JSON.stringify(process.env[match]),
        ],
      ],
    });

    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString?.()).toMatchInlineSnapshot(`
      "<script>
            let isDEV = "test" === 'development';
          </script>"
    `);
  });
});
