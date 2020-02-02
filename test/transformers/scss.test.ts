import { resolve } from 'path';

import getAutoPreprocess from '../../src';
import { preprocess } from '../utils';

describe('transformer - scss', () => {
  it('should prepend scss content via `data` option property', async () => {
    const template = `<style lang="scss"></style>`;
    const opts = getAutoPreprocess({
      scss: {
        data: '$color:red;div{color:$color}',
      },
    });
    const preprocessed = await preprocess(template, opts);
    expect(preprocessed.toString()).toContain('red');
  });

  it('should return @imported files as dependencies', async () => {
    const template = `<style lang="scss">@import "fixtures/style.scss";</style>`;
    const opts = getAutoPreprocess();
    const preprocessed = await preprocess(template, opts);
    expect(preprocessed.dependencies).toContain(
      resolve(__dirname, '..', 'fixtures', 'style.scss').replace(/[\\/]/g, '/'),
    );
  });
});
