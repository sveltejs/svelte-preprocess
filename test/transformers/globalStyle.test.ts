import autoProcess from '../../src';
import { preprocess } from '../utils';

describe('transformer - globalStyle', () => {
  describe('global attribute', () => {
    // todo: why it isn't generating a sourcemap?
    it('adds sourceMap with { sourceMap: true }', async () => {
      const template = `<style global>div,span{color:red}.test{}</style>`;
      const opts = autoProcess({
        globalStyle: {
          sourceMap: true,
        },
      });

      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toContain(`sourceMappingURL`);
    });

    it('wraps selector in :global(...) modifier', async () => {
      const template = `<style global>div{color:red}.test{}</style>`;
      const opts = autoProcess();
      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toContain(
        `:global(div){color:red}:global(.test){}`,
      );
    });

    it('wraps selector in :global(...) only if needed', async () => {
      const template = `<style global>.test{}:global(.foo){}</style>`;
      const opts = autoProcess();
      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toContain(
        `:global(.test){}:global(.foo){}`,
      );
    });

    it("prefixes @keyframes names with '-global-' only if needed", async () => {
      const template = `<style global>
@keyframes a {from{} to{}}@keyframes -global-b {from{} to{}}
</style>`;

      const opts = autoProcess();
      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toContain(
        `@keyframes -global-a {from{} to{}}@keyframes -global-b {from{} to{}}`,
      );
    });

    it('allows to use :local() at the beginning of a selector', async () => {
      const template = `<style global>:local(div) .test{}</style>`;
      const opts = autoProcess();
      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toContain(`div :global(.test){}`);
    });

    it('allows to use :local() in the middle of a selector', async () => {
      const template = `<style global>.test :local(div) .test{}</style>`;
      const opts = autoProcess();
      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toContain(
        `:global(.test) div :global(.test){}`,
      );
    });

    it('allows to use :local() in the end of a selector', async () => {
      const template = `<style global>.test :local(div){}</style>`;
      const opts = autoProcess();
      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toContain(`:global(.test) div{}`);
    });
  });

  describe('global selector', () => {
    describe('transformer - globalRule', () => {
      it('adds sourceMap with { sourceMap: true }', async () => {
        const template = `<style>:global div{color:red}:global .test{}</style>`;
        const opts = autoProcess({
          globalStyle: {
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
  });
});
