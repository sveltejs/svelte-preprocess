import { resolve } from 'path';

import { Diagnostic } from 'typescript';

import getAutoPreprocess from '../../src';
import { Processed } from '../../src/types';
import { preprocess, getFixtureContent, spyConsole } from '../utils';

spyConsole();

const EXPECTED_SCRIPT = getFixtureContent('script.js');

const autoProcessTS = (content: string, compilerOptions?: any) => {
  const opts = getAutoPreprocess({
    typescript: {
      tsconfigFile: false,
      compilerOptions: {
        ...compilerOptions,
        skipLibCheck: true,
      },
    },
  });

  return opts.script({
    content,
    attributes: { type: 'text/typescript' },
    filename: resolve(__dirname, '..', 'App.svelte'),
  }) as Processed & { diagnostics: Diagnostic[] };
};

describe('transformer - typescript', () => {
  const template = `<div></div><script lang="ts">${getFixtureContent(
    'script.ts',
  )}</script>`;

  it('should disallow transpilation to es5 or lower', async () => {
    await expect(
      autoProcessTS('export let foo = 10', { target: 'es3' }),
    ).rejects.toThrow();
    await expect(
      autoProcessTS('export let foo = 10', { target: 'es5' }),
    ).rejects.toThrow();
  });

  it('should throw if errors are found', async () => {
    await expect(autoProcessTS('export l et 0')).rejects.toThrow();
  });

  describe('configuration file', () => {
    it('should work with no compilerOptions', async () => {
      const opts = getAutoPreprocess({ typescript: { tsconfigFile: false } });
      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toContain('export var hello');
    });

    it('should work with tsconfigDirectory', async () => {
      const opts = getAutoPreprocess({
        typescript: {
          tsconfigFile: false,
          tsconfigDirectory: './test/fixtures',
        },
      });

      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toContain(EXPECTED_SCRIPT);
    });

    it('should work with tsconfigFile', async () => {
      const opts = getAutoPreprocess({
        typescript: {
          tsconfigFile: './test/fixtures/tsconfig.json',
        },
      });

      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toContain(EXPECTED_SCRIPT);
    });

    it('should report config syntactic errors in tsconfig file', () => {
      const opts = getAutoPreprocess({
        typescript: {
          tsconfigFile: './test/fixtures/tsconfig.syntactic.json',
        },
      });

      return expect(preprocess(template, opts)).rejects.toThrow('TS1005');
    });

    it('should report config semantic errors in tsconfig file', () => {
      const opts = getAutoPreprocess({
        typescript: {
          tsconfigFile: './test/fixtures/tsconfig.semantic.json',
        },
      });

      return expect(preprocess(template, opts)).rejects.toThrow('TS6046');
    });

    it('should transpile ts to js', async () => {
      const opts = getAutoPreprocess({
        typescript: {
          compilerOptions: {
            module: 'es6',
            sourceMap: false,
          },
        },
      });

      const { code } = await preprocess(template, opts);

      return expect(code).toContain(getFixtureContent('script.js'));
    });
  });
});
