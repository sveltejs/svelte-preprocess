import { resolve } from 'path';

import { compile } from 'svelte/compiler';

import sveltePreprocess from '../../src';
import { loadTsconfig } from '../../src/transformers/typescript';
import {
  preprocess,
  getFixtureContent,
  spyConsole,
  getTestAppFilename,
} from '../utils';

import type { Processed } from '../../src/types';
import type { Diagnostic } from 'typescript';

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

  return opts.script?.({
    content,
    markup: `<script lang="ts">${content}</script>`,
    attributes: { lang: 'ts' },
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

      expect(preprocessed.toString?.()).toContain('export var hello');
    });

    it('should work with tsconfigDirectory', async () => {
      const opts = sveltePreprocess({
        typescript: {
          tsconfigFile: false,
          tsconfigDirectory: './test/fixtures',
        },
      });

      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString?.()).toContain(EXPECTED_SCRIPT);
    });

    it('should work with tsconfigFile', async () => {
      const opts = sveltePreprocess({
        typescript: {
          tsconfigFile: './test/fixtures/tsconfig.json',
        },
      });

      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString?.()).toContain(EXPECTED_SCRIPT);
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

      expect(code).toContain(getFixtureContent('script.js'));
    });

    it('should strip unused and type imports', async () => {
      const tpl = getFixtureContent('TypeScriptImports.svelte');

      const opts = sveltePreprocess({
        typescript: { tsconfigFile: false },
      });

      const { code } = await preprocess(tpl, opts);

      // Test that imports are properly preserved
      expect(code).toContain(`import { fly } from "svelte/transition"`);
      expect(code).toContain(`import { flip } from "svelte/animate"`);
      expect(code).toContain(`import Nested from "./Nested.svelte"`);
      expect(code).toContain(`import { hello } from "./script"`);
      expect(code).toContain(`import { AValue } from "./types"`);
      expect(code).toContain(
        `import { storeTemplateOnly, storeScriptOnly, store0 } from "./store"`,
      );
      expect(code).toContain(
        `import { onlyUsedInModuleScript } from "./modulescript";`,
      );
      expect(code).toContain(
        `import { storeModuleTemplateOnly, storeModuleScriptOnly } from "./store";`,
      );
      // Test that comments are properly preserved
      expect(code).toContain('<!-- Some comment -->');
    });

    it('should keep all value imports with preserveValueImports', async () => {
      const tpl = getFixtureContent('PreserveValueImports.svelte');

      const opts = sveltePreprocess({
        typescript: {
          tsconfigFile: false,
          compilerOptions: { preserveValueImports: true },
        },
      });

      const { code } = await preprocess(tpl, opts);

      expect(code).toContain("import { Bar } from './somewhere'");
      expect(code).toContain("import Component from './component.svelte'");
      expect(code).toContain("import { Value } from './value'");
      expect(code).not.toContain("'./type'");
    });

    it('should deal with empty transpilation result', async () => {
      const tpl = getFixtureContent('TypeScriptTypesOnly.svelte');

      const opts = sveltePreprocess({
        typescript: { tsconfigFile: false },
        sourceMap: true,
      });

      const { code } = await preprocess(tpl, opts);

      expect(code).toBe(`<script lang="ts" context="module"></script>`);
    });

    it('should strip unused and type imports in context="module" tags', async () => {
      const tpl = getFixtureContent('TypeScriptImportsModule.svelte');

      const opts = sveltePreprocess({
        typescript: { tsconfigFile: false },
      });

      const { code } = await preprocess(tpl, opts);

      expect(code).toContain(`import { AValue } from "./types";`);
    });

    it('should produce sourcemap', async () => {
      const tpl = getFixtureContent('TypeScriptImportsModule.svelte');

      const opts = sveltePreprocess({
        typescript: { tsconfigFile: false },
        sourceMap: true,
      });

      const { map } = await preprocess(tpl, opts);

      expect(map).toHaveProperty('sources', ['App.svelte']);
    });

    it('should work when tsconfig contains outDir', async () => {
      const opts = sveltePreprocess({
        typescript: {
          tsconfigFile: './test/fixtures/tsconfig.outdir.json',
          handleMixedImports: true,
        },
        sourceMap: true,
      });

      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString?.()).toContain(EXPECTED_SCRIPT);
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

    it('should not override the target setting if one is present', async () => {
      const tpl = getFixtureContent('TypeScriptES2021.svelte');

      const opts = sveltePreprocess({
        typescript: {
          tsconfigFile: './test/fixtures/tsconfig.es2021target.json',
        },
      });

      const { code } = await preprocess(tpl, opts);

      expect(code).toContain('await ');
      expect(code).toContain('async function doIt');
      expect(code).toContain('&&=');
      expect(code).toContain('||=');

      // Svelte should be able to compile ES2021.
      const { warnings } = compile(code, { name: 'Test' });

      expect(warnings).toHaveLength(0);
    });

    it('should target ES6 if the configuration has no target setting', async () => {
      const tpl = getFixtureContent('TypeScriptES2021.svelte');

      const opts = sveltePreprocess({
        typescript: { tsconfigFile: false },
      });

      const { code } = await preprocess(tpl, opts);

      expect(code).not.toContain('await ');
      expect(code).not.toContain('async function doIt');
      expect(code).not.toContain('&&=');
      expect(code).not.toContain('||=');
    });
  });
});
