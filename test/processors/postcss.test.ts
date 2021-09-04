import { postcss } from '../../src';
import { CSS_PATTERN, preprocess, spyConsole } from '../utils';

spyConsole({ silent: true });

describe(`processor - postcss`, () => {
  it('should support external src files', async () => {
    const template = `<style src="./fixtures/style.css"></style><div></div>`;
    const preprocessed = await preprocess(template, [postcss()]);

    expect(preprocessed.toString?.()).toMatch(CSS_PATTERN);
  });

  it('should support prepended data', async () => {
    const template = `<style src="./fixtures/style.css"></style><div></div>`;
    const options = { prependData: '/* potato */' };
    const preprocessed = await preprocess(template, [postcss(options as any)]);

    expect(preprocessed.toString?.()).toContain('/* potato */');
  });
});
