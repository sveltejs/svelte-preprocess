import sveltePreprocess from '../../src';
import { getFixtureContent, preprocess, spyConsole } from '../utils';

spyConsole({ silent: true });

const EXPECTED_SCRIPT = getFixtureContent('script.js');

describe('transformer - civet', () => {
  const template = `<div></div><script lang="civet">${getFixtureContent(
    'script.civet',
  )}</script>`;

  describe('configuration file', () => {
    it('should work with no compilerOptions', async () => {
      const opts = sveltePreprocess({ civet: { tsconfigFile: false } });
      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString?.()).toContain('export var hello');
    });

    it('should work with tsconfigDirectory', async () => {
      const opts = sveltePreprocess({
        civet: {
          tsconfigFile: false,
          tsconfigDirectory: './test/fixtures',
        },
      });

      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString?.()).toContain(EXPECTED_SCRIPT);
    });

    it('should work with tsconfigFile', async () => {
      const opts = sveltePreprocess({
        civet: {
          tsconfigFile: './test/fixtures/tsconfig.json',
        },
      });

      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString?.()).toContain(EXPECTED_SCRIPT);
    });

    it('should report config semantic errors in tsconfig file', () => {
      const opts = sveltePreprocess({
        civet: {
          tsconfigFile: './test/fixtures/tsconfig.semantic.json',
        },
      });

      return expect(preprocess(template, opts)).rejects.toThrow('TS6046');
    });

    it('should transpile ts to js', async () => {
      const opts = sveltePreprocess({
        civet: {
          compilerOptions: {
            module: 'es6',
            sourceMap: false,
          },
        },
      });

      const { code } = await preprocess(template, opts);

      expect(code).toContain(getFixtureContent('script.js'));
    });

    it('should strip unused and type imports', async () => {
      const tpl = getFixtureContent('CivetImports.svelte');

      const opts = sveltePreprocess({
        civet: { tsconfigFile: false },
      });

      const { code } = await preprocess(tpl, opts);

      expect(code).toContain(`import { hello } from "./script.civet"`);
    });

    it('should produce sourcemap', async () => {
      const tpl = getFixtureContent('CivetImports.svelte');

      const opts = sveltePreprocess({
        civet: { tsconfigFile: false },
        sourceMap: true,
      });

      const { map } = await preprocess(tpl, opts);

      expect(map).toHaveProperty('sources', ['App.svelte']);
    });
  });
});
