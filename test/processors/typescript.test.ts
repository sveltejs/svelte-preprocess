import { typescript } from '../../src';
import { getFixtureContent, preprocess } from '../utils';

const EXPECTED_SCRIPT = getFixtureContent('script.js');

describe(`processor - typescript`, () => {
  it('should ignore other languages', async () => {
    const template = `<script lang="potato">🥔</script>`;
    const options = {};

    const preprocessed = await preprocess(template, [typescript(options)]);

    expect(preprocessed.toString?.()).toBe(template);
  });

  it('should leave other languages untouched', async () => {
    const template = `<script lang="potato">🥔</script>`;
    const options = { prependData: '/* potato */' };

    const preprocessed = await preprocess(template, [typescript(options)]);

    expect(preprocessed.toString?.()).toBe(template);
  });

  it('should support external src files', async () => {
    const template = `<script src="./fixtures/script.ts"></script><div></div>`;
    const options = {
      tsconfigFile: false,
      compilerOptions: { module: 'es2015' },
      prependData: '// potato',
    };

    const preprocessed = await preprocess(template, [typescript(options)]);

    expect(preprocessed.toString?.()).toContain(EXPECTED_SCRIPT);
  });

  it('should support prepended data', async () => {
    const template = `<script src="./fixtures/script.ts"></script><div></div>`;
    const options = {
      tsconfigFile: false,
      compilerOptions: { module: 'es2015' },
      prependData: '// potato',
    };

    const preprocessed = await preprocess(template, [typescript(options)]);

    expect(preprocessed.toString?.()).toContain('// potato');
  });
});
