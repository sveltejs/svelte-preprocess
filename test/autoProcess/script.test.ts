import getAutoPreprocess from '../../src';
import { preprocess, getFixtureContent, doesCompileThrow } from '../utils';

const SCRIPT_LANGS: Array<[string, string, object?]> = [
  ['coffeescript', 'coffee'],
  [
    'typescript',
    'ts',
    { tsconfigFile: false, compilerOptions: { module: 'es2015' } },
  ],
];

const EXPECTED_SCRIPT = getFixtureContent('script.js');

SCRIPT_LANGS.forEach(([lang, ext, langOptions]) => {
  describe(`script - preprocessor - ${lang}`, () => {
    const template = `<div></div><script lang="${lang}">${getFixtureContent(
      `script.${ext}`,
    )}</script>`;

    it(`should throw parsing ${lang} when { ${lang}: false }`, async () => {
      const input = `
        <div></div>
        <script src="./fixtures/script.${ext}"></script>
      `;

      const opts = getAutoPreprocess({
        [lang]: false,
      });

      expect(await doesCompileThrow(input, opts)).toBe(true);
    });

    it(`should parse ${lang}`, async () => {
      const opts = getAutoPreprocess({
        [lang]: langOptions,
      });

      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString()).toContain(EXPECTED_SCRIPT);
    });
  });
});
