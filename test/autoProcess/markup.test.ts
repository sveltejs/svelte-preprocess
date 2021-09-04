import sveltePreprocess from '../../src';
import { preprocess, getFixtureContent, doesCompileThrow } from '../utils';

const EXPECTED_MARKUP = getFixtureContent('template.html');
const MARKUP_LANGS: Array<[string, string]> = [['pug', 'pug']];

test('should transform HTML between <template></template>', async () => {
  const input = `<script></script><template><div>Hey</div></template><style></style>`;
  const preprocessed = await preprocess(input, sveltePreprocess());

  expect(preprocessed.toString?.()).toBe(
    `<script></script>${EXPECTED_MARKUP}<style></style>`,
  );
});

test('should transform HTML between custom tag <markup></markup>', async () => {
  const input = `<script></script><markup><div>Hey</div></markup><style></style>`;
  const preprocessed = await preprocess(
    input,
    sveltePreprocess({ markupTagName: 'markup' }),
  );

  expect(preprocessed.toString?.()).toBe(
    `<script></script>${EXPECTED_MARKUP}<style></style>`,
  );
});

test('should transform a custom language between <template lang="..."></template>', async () => {
  const input = `<script></script><template lang="test"><div>Hey</div></template><style></style>`;
  const preprocessed = await preprocess(
    input,
    sveltePreprocess({
      test() {
        return { code: '' };
      },
    }),
  );

  expect(preprocessed.toString?.()).toBe('<script></script><style></style>');
});

test('should ignore subsequent markup tags.', async () => {
  const input = `<template><div>Hey</div></template><template>ignored</template>`;
  const preprocessed = await preprocess(input, sveltePreprocess());

  expect(preprocessed.toString?.()).toBe(
    `<div>Hey</div><template>ignored</template>`,
  );
});

MARKUP_LANGS.forEach(([lang, ext]) => {
  describe(`markup - preprocessor - ${lang}`, () => {
    const template = `<template lang="${lang}">${getFixtureContent(
      `template.${ext}`,
    )}</template>`;

    it(`should NOT throw parsing ${lang} when { ${lang}: false }`, async () => {
      const opts = sveltePreprocess({ pug: false });

      expect(await doesCompileThrow(template, opts)).toBe(false);
    });

    it(`should parse ${lang}`, async () => {
      const preprocessed = (await preprocess(template, sveltePreprocess()))
        .toString?.()
        .trim();

      expect(preprocessed).toBe(EXPECTED_MARKUP);
    });
  });
});
