import getAutoPreprocess from '../../src';
import { preprocess, getFixtureContent, doesCompileThrow } from '../utils';

const EXPECTED_MARKUP = getFixtureContent('template.html');
const MARKUP_LANGS: Array<[string, string]> = [['pug', 'pug']];

test('should transform HTML between <template></template>', async () => {
  const input = `<script></script><template><div>Hey</div></template><style></style>`;
  const preprocessed = await preprocess(input, getAutoPreprocess());

  expect(preprocessed.toString()).toBe(
    `<script></script>${EXPECTED_MARKUP}<style></style>`,
  );
});

test('should transform HTML between custom tag <markup></markup>', async () => {
  const input = `<script></script><markup><div>Hey</div></markup><style></style>`;
  const preprocessed = await preprocess(
    input,
    getAutoPreprocess({ markupTagName: 'markup' }),
  );

  expect(preprocessed.toString()).toBe(
    `<script></script>${EXPECTED_MARKUP}<style></style>`,
  );
});

test('should transform a custom language between <template lang="..."></template>', async () => {
  const input = `<script></script><template lang="test"><div>Hey</div></template><style></style>`;
  const preprocessed = await preprocess(
    input,
    getAutoPreprocess({
      test() {
        return { code: '' };
      },
    }),
  );

  expect(preprocessed.toString()).toBe('<script></script><style></style>');
});

MARKUP_LANGS.forEach(([lang, ext]) => {
  describe(`markup - preprocessor - ${lang}`, () => {
    const template = `<template lang="${lang}">${getFixtureContent(
      `template.${ext}`,
    )}</template>`;

    it(`should throw parsing ${lang} when { ${lang}: false }`, async () => {
      const opts = getAutoPreprocess({ pug: false });

      expect(await doesCompileThrow(template, opts)).toBe(true);
    });

    it(`should parse ${lang}`, async () => {
      const preprocessed = (await preprocess(template, getAutoPreprocess()))
        .toString()
        .trim();

      expect(preprocessed.toString()).toBe(EXPECTED_MARKUP);
    });
  });
});
