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
];

describe('transformer - regex', () => {
  it('replaces string patterns in markup with string patterns', async () => {
    const template = `
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
@endawait`.repeat(2);
    const opts = autoProcess({ regex: options });
    const preprocessed = await preprocess(template, opts);
    expect(preprocessed.toString()).toMatchInlineSnapshot(`
      "
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
      @endawait
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
      @endawait"
    `);
  });

  it('replaces string patterns in markup with string patterns', async () => {
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
