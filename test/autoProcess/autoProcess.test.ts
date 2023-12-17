import sveltePreprocess from '../../src';
import {
  preprocess,
  getFixtureContent,
  doesCompileThrow,
  CSS_PATTERN,
} from '../utils';
import { getLanguage } from '../../src/modules/language';

describe('detect - mimetype', () => {
  const MIMETYPES = [
    { lang: 'stylus', targetLanguage: 'stylus' },
    { src: '../foo.js', targetLanguage: 'javascript' },
    {
      src: '../foo.custom',
      lang: 'customLanguage',
      targetLanguage: 'customLanguage',
    },
    {
      src: '{_potato("foo")}',
      targetLanguage: null,
    },
  ];

  MIMETYPES.forEach(({ lang, src, targetLanguage }) => {
    it(`should detect '${src ?? lang}' as '${targetLanguage}'`, async () => {
      const language = getLanguage({ lang, src } as any);

      expect(language).toMatchObject({ lang: targetLanguage });
    });
  });
});

describe('options', () => {
  it('should accept custom method for a transformer', async () => {
    const input = `<template lang="customTransformer">${getFixtureContent(
      'template.custom',
    )}</template>`;

    const opts = sveltePreprocess({
      customTransformer({ content }: any) {
        content = content.replace('foo', 'bar').toString().trim();

        return { code: content, map: null };
      },
    });

    const preprocessed = await preprocess(input, opts);

    expect(preprocessed.toString?.()).toBe('bar');
  });

  it('should accept an options object as transformer value', async () => {
    const input = `<div></div><style src="./fixtures/style.scss"></style>`;
    const preprocessed = await preprocess(
      input,
      sveltePreprocess({
        scss: {
          sourceMap: false,
          includePaths: ['node_modules'],
        },
      }),
    );

    expect(preprocessed.toString?.()).toMatch(CSS_PATTERN);
  });

  it('should append aliases to the language alias dictionary', async () => {
    const input = `<script lang="cl"></script>`;
    const opts = sveltePreprocess({
      aliases: [['cl', 'javascript']],
    });

    expect(await doesCompileThrow(input, opts)).toBe(false);
  });

  it('should allow to pass a method as an language alias transformer', async () => {
    const input = `<style lang="cl"></style>`;
    const opts = sveltePreprocess({
      aliases: [['cl', 'customLanguage']],
      cl() {
        return { code: 'div{}' };
      },
    });

    expect(await doesCompileThrow(input, opts)).toBe(false);

    const preprocessed = await preprocess(input, opts);

    expect(preprocessed.toString?.()).toContain('div{}');
  });

  it('should allow to pass a method as an language transformer', async () => {
    const input = `<style lang="cl"></style>`;
    const opts = sveltePreprocess({
      aliases: [['cl', 'customLanguage']],
      customLanguage() {
        return { code: 'div{}' };
      },
    });

    expect(await doesCompileThrow(input, opts)).toBe(false);

    const preprocessed = await preprocess(input, opts);

    expect(preprocessed.toString?.()).toContain('div{}');
  });

  it('should NOT preprocess preserved languages', async () => {
    const input = `<div></div><script type="ld+json">{"json":true}</script>`;
    const opts = sveltePreprocess();

    const preprocessed = await preprocess(input, opts);

    expect(preprocessed.toString?.()).toContain(
      `<script type="ld+json">{"json":true}</script>`,
    );
  });

  it('should allow to pass specific options to alias', async () => {
    const input = `<div></div><style lang="sass">${getFixtureContent(
      'style.sass',
    )}</style>`;

    const opts = sveltePreprocess({
      sass: {
        indentedSyntax: false,
      },
    });

    expect(await doesCompileThrow(input, opts)).toBe(true);
  });

  it('should respect lang/type attributes even if another default language is set', async () => {
    const input = `<script lang="tomatoScript">script</script>`;

    const opts = sveltePreprocess({
      defaults: {
        script: 'potatoScript',
      },
      potatoScript({ content }: any) {
        return { code: content.replace('script', 'potato') };
      },
      tomatoScript({ content }: any) {
        return { code: content.replace('script', 'tomato') };
      },
    });

    const preprocessed = await preprocess(input, opts);

    expect(preprocessed.toString?.()).toContain(
      '<script lang="tomatoScript">tomato</script>',
    );
  });
});
