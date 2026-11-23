import { describe, it, expect } from 'vitest';
import sugarss from 'sugarss';
import { postcss } from '../../src';
import { CSS_PATTERN, preprocess, spyConsole } from '../utils';

spyConsole({ silent: true });

describe(`processor - postcss`, () => {
  it('should support the SugarSS parser', async () => {
    const template = `<style>
div
  color: red
</style>`;

    const preprocessed = await preprocess(template, [
      postcss({ parser: sugarss }),
    ]);

    expect(preprocessed.toString?.()).toMatchInlineSnapshot(`
      "<style>
      div {
        color: red
      }

      </style>"
    `);
  });

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
