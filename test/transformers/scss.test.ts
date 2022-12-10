/* eslint-disable node/global-require */
/* eslint-disable @typescript-eslint/no-require-imports */

import { resolve } from 'path';

import sveltePreprocess from '../../src';
import { preprocess } from '../utils';
import { transformer } from '../../src/transformers/scss';

describe('transformer - scss', () => {
  it('should return @imported files as dependencies - via default async render', async () => {
    const template = `<style lang="scss">@import "./fixtures/style.scss";</style>`;
    const opts = sveltePreprocess();

    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.dependencies).toContain(
      resolve(__dirname, '..', 'fixtures', 'style.scss'),
    );
  });

  it('should return @imported files as dependencies - via renderSync', async () => {
    const template = `<style lang="scss">@import "fixtures/style.scss";</style>`;
    const opts = sveltePreprocess({});

    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.dependencies).toContain(
      resolve(__dirname, '..', 'fixtures', 'style.scss'),
    );
  });

  it('should prepend scss content via `data` option property - via renderSync', async () => {
    const template = `<style lang="scss"></style>`;
    const opts = sveltePreprocess({
      scss: {
        prependData: '$color:blue;div{color:$color}',
      },
    });

    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString?.()).toContain('blue');
  });

  it('supports ~ tilde imports (removes the character)', async () => {
    const template = `<style lang="scss">@import '~scss-package/main.scss'</style>`;
    const opts = sveltePreprocess();

    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString?.()).toMatchInlineSnapshot(`
      "<style lang=\\"scss\\">div {
        color: pink;
      }</style>"
    `);
  });

  it('returns the source map and removes sourceMappingURL from code', async () => {
    const content = `
$color:red;

div{
  color:$color
}
`;

    const filename = '/file';
    const options = {
      sourceMap: true,
    };

    const { map, code } = await transformer({ content, filename, options });

    expect(code).not.toContain('sourceMappingURL');
    expect(map).toBeDefined();
  });
});
