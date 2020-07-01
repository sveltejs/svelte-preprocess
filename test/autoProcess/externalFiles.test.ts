import { resolve } from 'path';

import getAutoPreprocess from '../../src';
import { Processed } from '../../src/types';
import { preprocess, getFixtureContent, getFixturePath } from '../utils';

const {
  markup: markupProcessor,
  script: scriptProcessor,
  style: styleProcessor,
} = getAutoPreprocess();

const REMOTE_JS = [
  'https://www.example.com/some/externally/delivered/content.js',
  'http://www.example.com/some/externally/delivered/content.js',
  '//www.example.com/some/externally/delivered/content.js',
];

describe('external files', () => {
  let markup: Processed;
  let script: Processed;
  let style: Processed;

  beforeAll(async () => {
    [markup, script, style] = [
      await markupProcessor({
        content: `<template src="./fixtures/template.html"></template>
        <style src="./fixtures/style.css"></style>
        <script src="./fixtures/script.js"></script>`,
        filename: resolve(__dirname, '..', 'App.svelte'),
      }),
      await scriptProcessor({
        content: ``,
        filename: resolve(__dirname, '..', 'App.svelte'),
        attributes: { src: `./fixtures/script.js` },
      }),
      await styleProcessor({
        content: ``,
        filename: resolve(__dirname, '..', 'App.svelte'),
        attributes: { src: `./fixtures/style.css` },
      }),
    ];
  });

  it('should insert external file content', async () => {
    expect(markup.code).toContain(getFixtureContent('template.html'));
    expect(script.code).toContain(getFixtureContent('script.js'));
    expect(style.code).toContain(getFixtureContent('style.css'));
  });

  it('should add a external file as a dependency', async () => {
    expect(markup.dependencies).toContain(getFixturePath('template.html'));
    expect(script.dependencies).toContain(getFixturePath('script.js'));
    expect(style.dependencies).toContain(getFixturePath('style.css'));
  });

  REMOTE_JS.forEach((url) => {
    it(`should not attempt to locally resolve ${url}`, async () => {
      const input = `<div></div><script src="${url}"></script>`;

      const preprocessed = await preprocess(input, getAutoPreprocess());

      expect(preprocessed.toString()).toContain(input);
      expect(preprocessed.dependencies).toHaveLength(0);
    });
  });

  it("should warn if local file don't exist", async () => {
    const spy = jest.spyOn(console, 'warn');
    const input = `<style src="./missing-potato"></style>`;

    await preprocess(input, getAutoPreprocess());

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('was not found'));

    spy.mockRestore();
  });
});
