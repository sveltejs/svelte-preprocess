import autoProcess from '../../src';
import { preprocess } from '../utils';

describe('transformer - globalRule', () => {
  it('does nothing if postcss is not installed', async () => {
    const template = `<style>:global div{color:red}:global .test{}</style>`;
    const opts = autoProcess();

    expect(() => preprocess(template, opts)).not.toThrow();
  });

  it('adds sourceMap with { sourceMap: true }', async () => {
    const template = `<style>:global div{color:red}:global .test{}</style>`;
    const opts = autoProcess({
      globalRule: {
        sourceMap: true,
      },
    });
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString()).toContain(`sourceMappingURL`);
  });

  it('wraps selector in :global(...) modifier', async () => {
    const template = `<style>:global div{color:red}:global .test{}</style>`;
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString()).toContain(
      `:global(div){color:red}:global(.test){}`,
    );
  });

  it('wraps selector in :global(...) only if needed', async () => {
    const template = `<style>:global .test{}:global :global(.foo){}</style>`;
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString()).toContain(
      `:global(.test){}:global(.foo){}`,
    );
  });

  it('wraps selector in :global(...) on multiple levels', async () => {
    const template = '<style>:global div .cls{}</style>';
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString()).toMatch(
      // either be :global(div .cls){}
      //        or :global(div) :global(.cls){}
      /(:global\(div .cls\)\{\}|:global\(div\) :global\(\.cls\)\{\})/,
    );
  });

  it('wraps selector in :global(...) on multiple levels when in the middle', async () => {
    const template = '<style>div div :global span .cls{}</style>';
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString()).toMatch(
      // either be div div :global(span .cls) {}
      //        or div div :global(span) :global(.cls) {}
      /div div (:global\(span .cls\)\{\}|:global\(span\) :global\(\.cls\)\{\})/,
    );
  });

  it('does not break when at the end', async () => {
    const template = '<style>span :global{}</style>';
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString()).toContain('span{}');
  });

  it('works with collapsed nesting several times', async () => {
    const template = '<style>div :global span :global .cls{}</style>';
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString()).toMatch(
      // either be div :global(span .cls) {}
      //        or div :global(span) :global(.cls) {}
      /div (:global\(span .cls\)\{\}|:global\(span\) :global\(\.cls\)\{\})/,
    );
  });

  it('does not interfere with the :global(...) syntax', async () => {
    const template = '<style>div :global(span){}</style>';
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString()).toContain('div :global(span){}');
  });

  it('allows mixing with the :global(...) syntax', async () => {
    const template = '<style>div :global(span) :global .cls{}</style>';
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString()).toMatch(
      // either be div :global(span .cls) {}
      //        or div :global(span) :global(.cls) {}
      /div (:global\(span .cls\)\{\}|:global\(span\) :global\(\.cls\)\{\})/,
    );
  });

  it('removes rules with only :global as its selector', async () => {
    const template =
      '<style>:global{/*comment*/}:global,div{/*comment*/}</style>';
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString()).toContain(
      '<style>div{/*comment*/}</style>',
    );
  });
});
