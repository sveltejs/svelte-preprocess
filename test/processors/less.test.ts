import { less } from '../../src';
import { CSS_PATTERN, preprocess } from '../utils';

describe(`processor - less`, () => {
  it('should ignore other languages', async () => {
    const template = `<style lang="potato">🥔</style>`;
    const options = {};

    const preprocessed = await preprocess(template, [less(options)]);

    expect(preprocessed.toString?.()).toBe(template);
  });

  it('should leave other languages untouched', async () => {
    const template = `<script lang="potato">🥔</script>`;
    const options = { prependData: '/* potato */' };

    const preprocessed = await preprocess(template, [less(options)]);

    expect(preprocessed.toString?.()).toBe(template);
  });

  it('should support external src files', async () => {
    const template = `<style src="./fixtures/style.less"></style><div></div>`;
    const preprocessed = await preprocess(template, [less()]);

    expect(preprocessed.toString?.()).toMatch(CSS_PATTERN);
  });

  it('should support prepended data', async () => {
    const template = `<style src="./fixtures/style.less"></style><div></div>`;
    const options = { prependData: '/* potato */' };
    const preprocessed = await preprocess(template, [less(options)]);

    expect(preprocessed.toString?.()).toContain('/* potato */');
  });
});
