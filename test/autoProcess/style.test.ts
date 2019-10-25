import getAutoPreprocess from '../../src';
import {
  preprocess,
  getFixtureContent,
  doesCompileThrow,
  CSS_PATTERN,
} from '../utils';

const STYLE_LANGS: [string, string][] = [
  ['sass', 'sass'],
  ['less', 'less'],
  ['scss', 'scss'],
  ['stylus', 'styl'],
];

STYLE_LANGS.forEach(([lang, ext]) => {
  describe(`style - preprocessor - ${lang}`, () => {
    const template = `<div></div><style lang="${lang}">${getFixtureContent(
      'style.' + ext,
    )}</style>`;
    const templateExternal = `<div></div><style src="./fixtures/style.${ext}"></style>`;

    it(`should throw parsing ${lang} when { ${lang}: false }`, async () => {
      const opts = getAutoPreprocess({
        [lang]: false,
      });
      expect(await doesCompileThrow(template, opts)).toBe(true);
    });

    it(`should parse ${lang}`, async () => {
      const opts = getAutoPreprocess();
      const preprocessed = await preprocess(template, opts);
      expect(preprocessed.toString()).toMatch(CSS_PATTERN);
    });

    it(`should parse external ${lang}`, async () => {
      const opts = getAutoPreprocess();
      const preprocessed = await preprocess(templateExternal, opts);
      expect(preprocessed.toString()).toMatch(CSS_PATTERN);
    });
  });
});

describe('style - postcss', () => {
  const template = `<div></div><style>div{appearance:none;}</style>`;
  const templateSass = `<div></div><style lang="scss">div{appearance:none;}</style>`;
  const optsWithoutConfigFile = getAutoPreprocess({
    postcss: {
      plugins: [
        require('autoprefixer')({
          overrideBrowserslist: 'Safari >= 5.1',
        }),
      ],
    },
  });

  it('should not transform plain css with postcss if { postcss: falsy }', async () => {
    const preprocessed = await preprocess(template, getAutoPreprocess());
    expect(preprocessed.toString()).not.toMatch(/-webkit-/);
  });

  it('should not transform plain css with postcss if { postcss: true } and no configuration file at cwd', async () => {
    const preprocessed = await preprocess(
      template,
      getAutoPreprocess({
        postcss: true,
      }),
    );
    expect(preprocessed.toString()).not.toMatch(/-webkit-/);
  });

  it('should transform plain css with postcss if { postcss: { plugins... } }', async () => {
    const preprocessed = await preprocess(template, optsWithoutConfigFile);
    expect(preprocessed.toString()).toMatch(/-webkit-/);
  });

  it('should transform async preprocessed css with postcss if { postcss: { plugins... } }', async () => {
    const preprocessed = await preprocess(templateSass, optsWithoutConfigFile);
    expect(preprocessed.toString()).toMatch(/-webkit-/);
  });

  it('should transform plain css with postcss if { postcss: { configFilePath: ... } }', async () => {
    const preprocessed = await preprocess(
      template,
      getAutoPreprocess({
        postcss: {
          configFilePath: './test/fixtures/',
        },
      }),
    );
    expect(preprocessed.toString()).toMatch(/-webkit-/);
  });
});
