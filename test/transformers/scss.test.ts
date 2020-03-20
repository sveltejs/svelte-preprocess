import { resolve } from 'path';

import getAutoPreprocess from '../../src';
import { preprocess } from '../utils';

describe('transformer - scss', () => {
  it('should prepend scss content via `data` option property - via defaul async render', async () => {
    const template = `<style lang="scss"></style>`;
    const opts = getAutoPreprocess({
      scss: {
        data: '$color:red;div{color:$color}',
      },
    });
    const preprocessed = await preprocess(template, opts);
    expect(preprocessed.toString()).toContain('red');
  });

  it('should return @imported files as dependencies - via default async render', async () => {
    const template = `<style lang="scss">@import "fixtures/style.scss";</style>`;
    const opts = getAutoPreprocess();
    const preprocessed = await preprocess(template, opts);
    expect(preprocessed.dependencies).toContain(
      resolve(__dirname, '..', 'fixtures', 'style.scss').replace(/[\\/]/g, '/'),
    );
  });

  it('should prepend scss content via `data` option property - via renderSync', async () => {
    const template = `<style lang="scss"></style>`;
    const opts = getAutoPreprocess({
      scss: {
        data: '$color:blue;div{color:$color}',
        renderSync: true,
      },
    });
    const preprocessed = await preprocess(template, opts);
    expect(preprocessed.toString()).toContain('blue');
  });

  it('should return @imported files as dependencies - via renderSync', async () => {
    const template = `<style lang="scss">@import "fixtures/style.scss";</style>`;
    const opts = getAutoPreprocess({
      scss: {
        renderSync: true,
      },
    });
    const preprocessed = await preprocess(template, opts);
    expect(preprocessed.dependencies).toContain(
      resolve(__dirname, '..', 'fixtures', 'style.scss').replace(/[\\/]/g, '/'),
    );
  });  
});
