import { coffeescript } from '../../src';
import { getFixtureContent, preprocess } from '../utils';

const EXPECTED_SCRIPT = getFixtureContent('script.js');

describe(`processor - coffeescript`, () => {
  it('should ignore other languages', async () => {
    const template = `<script lang="potato">🥔</script>`;
    const options = {};

    const preprocessed = await preprocess(template, [coffeescript(options)]);

    expect(preprocessed.toString?.()).toBe(template);
  });

  it('should leave other languages untouched', async () => {
    const template = `<script lang="potato">🥔</script>`;
    const options = {
      stripIndent: true,
      prependData: '/* potato */',
    };

    const preprocessed = await preprocess(template, [coffeescript(options)]);

    expect(preprocessed.toString?.()).toBe(template);
  });

  it('should support external src files', async () => {
    const template = `<script src="./fixtures/script.coffee"></script>`;
    const options = {};

    const preprocessed = await preprocess(template, [coffeescript(options)]);

    expect(preprocessed.toString?.()).toContain(EXPECTED_SCRIPT);
  });

  it('should support prepended data', async () => {
    const template = `<script src="./fixtures/script.coffee"></script>`;
    const options = {
      prependData: '### potato ###',
    };

    const preprocessed = await preprocess(template, [coffeescript(options)]);

    expect(preprocessed.toString?.()).toContain('/* potato */');
  });
});
