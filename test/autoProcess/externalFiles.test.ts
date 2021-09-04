import { resolve } from 'path';

import sveltePreprocess from '../../src';
import {
  preprocess,
  getFixtureContent,
  getFixturePath,
  spyConsole,
} from '../utils';

const { warnSpy } = spyConsole({ silent: true });

const {
  markup: markupProcessor,
  script: scriptProcessor,
  style: styleProcessor,
} = sveltePreprocess();

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

  REMOTE_JS.forEach((url) => {
    it(`should not attempt to locally resolve ${url}`, async () => {
      const input = `<div></div><script src="${url}"></script>`;

      const preprocessed = await preprocess(input, sveltePreprocess());

      expect(preprocessed.toString()).toContain(input);
      expect(preprocessed.dependencies).toHaveLength(0);
    });
  });

  it("should warn if local file don't exist", async () => {
    const input = `<style src="./missing-potato"></style>`;

    await preprocess(input, sveltePreprocess());

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('was not found'),
    );
  });
});
