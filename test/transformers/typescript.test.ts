import { resolve } from 'path';

import type { Diagnostic } from 'typescript';

import sveltePreprocess from '../../src';
import { loadTsconfig } from '../../src/transformers/typescript';
import type { Processed } from '../../src/types';
import {
  preprocess,
  getFixtureContent,
  spyConsole,
  getTestAppFilename,
} from '../utils';

spyConsole({ silent: true });

const EXPECTED_SCRIPT = getFixtureContent('script.js');

const autoProcessTS = (content: string, compilerOptions?: any) => {
  const opts = sveltePreprocess({
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
    markup: `<script lang="ts">${content}</script>`,
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
      const opts = sveltePreprocess({ typescript: { tsconfigFile: false } });
      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toContain('export var hello');
    });

    it('should work with tsconfigDirectory', async () => {
      const opts = sveltePreprocess({
        typescript: {
          tsconfigFile: false,
          tsconfigDirectory: './test/fixtures',
        },
      });

      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toContain(EXPECTED_SCRIPT);
    });

    it('should work with tsconfigFile', async () => {
      const opts = sveltePreprocess({
        typescript: {
          tsconfigFile: './test/fixtures/tsconfig.json',
        },
      });

      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toContain(EXPECTED_SCRIPT);
    });

    it('should report config semantic errors in tsconfig file', () => {
      const opts = sveltePreprocess({
        typescript: {
          tsconfigFile: './test/fixtures/tsconfig.semantic.json',
        },
      });

      return expect(preprocess(template, opts)).rejects.toThrow('TS6046');
    });

    it('should transpile ts to js', async () => {
      const opts = sveltePreprocess({
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

    it('should strip unused and type imports', async () => {
      const tpl = getFixtureContent('TypeScriptImports.svelte');

      const opts = sveltePreprocess({ typescript: { tsconfigFile: false } });
      const { code } = await preprocess(tpl, opts);

      return expect(code).toContain(`import { AValue } from "./types";`);
    });

    it('should strip unused and type imports in context="module" tags', async () => {
      const tpl = getFixtureContent('TypeScriptImportsModule.svelte');

      const opts = sveltePreprocess({ typescript: { tsconfigFile: false } });
      const { code } = await preprocess(tpl, opts);

      return expect(code).toContain(`import { AValue } from "./types";`);
    });

    it('should produce sourcemap', async () => {
      const tpl = getFixtureContent('TypeScriptImportsModule.svelte');

      const opts = sveltePreprocess({
        typescript: { tsconfigFile: false },
        sourceMap: true,
      });

      const { map } = await preprocess(tpl, opts);

      return expect(map).toHaveProperty('sources', ['App.svelte']);
    });

    it('supports extends field', () => {
      const { options } = loadTsconfig({}, getTestAppFilename(), {
        tsconfigFile: './test/fixtures/tsconfig.extends1.json',
      });

      expect(options).toMatchObject({
        module: 5,
        skipLibCheck: false,
        esModuleInterop: true,
      });
    });
  });
});
