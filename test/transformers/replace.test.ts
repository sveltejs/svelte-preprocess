import autoProcess from '../../src';
import { preprocess } from '../utils';

const options = [
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

    expect(preprocessed.toString()).toMatchInlineSnapshot(`
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

    expect(preprocessed.toString()).toMatchInlineSnapshot(`
"<script>
      let isDEV = \\"test\\" === 'development';
    </script>"
`);
  });
});
