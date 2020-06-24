import { resolve } from 'path';

import getAutoPreprocess from '../../src';
import { preprocess } from '../utils';
import { Options } from '../../src/types';

const implementation: Options.Sass['implementation'] = {
  render(options, callback) {
    callback(null, {
      css: Buffer.from('div#red{color:red}'),
      stats: {
        entry: 'data',
        start: 0,
        end: 1,
        duration: 1,
        includedFiles: [],
      },
    });
  },
  renderSync: () => ({
    css: Buffer.from('div#green{color:green}'),
    stats: {
      entry: 'data',
      start: 0,
      end: 1,
      duration: 1,
      includedFiles: [],
    },
  }),
};

describe('transformer - scss', () => {
  it('should prepend scss content via `data` option property - via default async render', async () => {
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

  it('should use the specified implementation via the `implementation` option property - via default async render', async () => {
    const template = `<style lang="scss">h1{}</style>`;
    const opts = getAutoPreprocess({
      scss: {
        implementation,
      },
    });

    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString()).toContain('div#red{color:red}');
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

  it('should use the specified implementation via the `implementation` option property - via renderSync', async () => {
    const template = `<style lang="scss">h1{}</style>`;
    const opts = getAutoPreprocess({
      scss: {
        implementation,
        renderSync: true,
      },
    });

    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString()).toContain('div#green{color:green}');
  });
});
