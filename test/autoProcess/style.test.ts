import getAutoPreprocess from '../../src';
import {
  preprocess,
  getFixtureContent,
  doesCompileThrow,
  CSS_PATTERN,
} from '../utils';

const STYLE_LANGS: Array<[string, string]> = [
  ['sass', 'sass'],
  ['less', 'less'],
  ['scss', 'scss'],
  ['stylus', 'styl'],
];

STYLE_LANGS.forEach(([lang, ext]) => {
  describe(`style - preprocessor - ${lang}`, () => {
    it(`should throw parsing ${lang} when { ${lang}: false }`, async () => {
      const template = `<div></div><style lang="${lang}">${getFixtureContent(
        `style.${ext}`,
      )}</style>`;

      const opts = getAutoPreprocess({
        [lang]: false,
      });

      expect(await doesCompileThrow(template, opts)).toBe(true);
    });

    it(`should parse ${lang}`, async () => {
      const template = `<div></div><style lang="${lang}">${getFixtureContent(
        `style.${ext}`,
      )}</style>`;

      const opts = getAutoPreprocess();
      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toMatch(CSS_PATTERN);
    });

    it(`should parse external ${lang}`, async () => {
      const templateExternal = `<div></div><style src="./fixtures/style.${ext}"></style>`;
      const opts = getAutoPreprocess();
      const preprocessed = await preprocess(templateExternal, opts);

      expect(preprocessed.toString()).toMatch(CSS_PATTERN);
    });

    it(`should parse external ${lang}`, async () => {
      const templateExternal = `<div></div><style src="./fixtures/style.${ext}"></style>`;
      const opts = getAutoPreprocess();
      const preprocessed = await preprocess(templateExternal, opts);

      expect(preprocessed.toString()).toMatch(CSS_PATTERN);
    });

    it(`should return empty if content is empty`, async () => {
      const templateExternal = `<div></div><style lang="${lang}"></style>`;
      const opts = getAutoPreprocess({
        [lang]: {
          sourceMap: false,
          sourcemap: false,
          map: false,
        },
      });

      const preprocessed = await preprocess(templateExternal, opts);

      expect(preprocessed.toString()).toMatch(templateExternal);
    });
  });
});
