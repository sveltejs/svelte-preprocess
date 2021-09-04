import sveltePreprocess from '../../src';
import { preprocess, getFixtureContent } from '../utils';

const SCRIPT_LANGS: Array<[string, string, any?]> = [
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

    it(`should parse ${lang}`, async () => {
      const opts = sveltePreprocess({
        [lang]: langOptions,
      });

      const preprocessed = await preprocess(template, opts);

      expect(preprocessed.toString?.()).toContain(EXPECTED_SCRIPT);
    });
  });
});
