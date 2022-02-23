import { resolve } from 'path';

import sveltePreprocess from '../../src';
import {
  preprocess,
  getFixtureContent,
  getFixturePath,
  spyConsole,
} from '../utils';

import type { AutoPreprocessGroup } from '../../src/types';

const { warnSpy } = spyConsole({ silent: true });

const {
  markup: markupProcessor,
  script: scriptProcessor,
  style: styleProcessor,
} = sveltePreprocess() as Required<AutoPreprocessGroup>;

const REMOTE_JS = [
  'https://www.example.com/some/externally/delivered/content.js',
  'http://www.example.com/some/externally/delivered/content.js',
  '//www.example.com/some/externally/delivered/content.js',
];

describe('external files', () => {
  afterEach(warnSpy.mockClear);

  it('should insert external file content and add as deps', async () => {
    const code = `<template src="./fixtures/template.html"></template>
    <style src="./fixtures/style.css"></style>
    <script src="./fixtures/script.js"></script>`;

    const [markup, script, style] = [
      await markupProcessor({
        content: code,
        filename: resolve(__dirname, '..', 'App.svelte'),
      }),
      await scriptProcessor({
        content: ``,
        markup: code,
        filename: resolve(__dirname, '..', 'App.svelte'),
        attributes: { src: `./fixtures/script.js` },
      }),
      await styleProcessor({
        content: ``,
        markup: code,
        filename: resolve(__dirname, '..', 'App.svelte'),
        attributes: { src: `./fixtures/style.css` },
      }),
    ];

    expect(markup.code).toContain(getFixtureContent('template.html'));
    expect(script.code).toContain(getFixtureContent('script.js'));
    expect(style.code).toContain(getFixtureContent('style.css'));
    expect(markup.dependencies).toContain(getFixturePath('template.html'));
    expect(script.dependencies).toContain(getFixturePath('script.js'));
    expect(style.dependencies).toContain(getFixturePath('style.css'));
  });

  it('should support self-closing tags', async () => {
    const markup = await markupProcessor({
      content: `<template src="./fixtures/template.html"/>`,
      filename: resolve(__dirname, '..', 'App.svelte'),
    });

    expect(markup.code).toContain(getFixtureContent('template.html'));
  });

  it("warns if local file don't exist", async () => {
    const input = `<style src="./missing-potato"></style>`;

    await preprocess(input, sveltePreprocess());

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('was not found'),
    );
  });

  REMOTE_JS.forEach((url) => {
    it(`ignores remote path "${url}"`, async () => {
      const input = `<div></div><script src="${url}"></script>`;

      const preprocessed = await preprocess(input, sveltePreprocess());

      expect(preprocessed.toString?.()).toContain(input);
      expect(preprocessed.dependencies).toHaveLength(0);
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('was not found'),
      );
    });
  });

  it('ignores external source if path is not relative', async () => {
    const input = `<style src="/root-potato"></style>`;

    await preprocess(input, sveltePreprocess());

    const preprocessed = await preprocess(input, sveltePreprocess());

    expect(preprocessed.toString?.()).toContain(input);
    expect(preprocessed.dependencies).toHaveLength(0);
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('was not found'),
    );
  });
});
