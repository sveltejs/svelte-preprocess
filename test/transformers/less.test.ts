import { resolve } from 'path';

import sveltePreprocess from '../../src';
import { preprocess } from '../utils';

describe('transformer - less', () => {
  it('should return @imported files as dependencies', async () => {
    const template = `<style lang="less">@import "fixtures/style.less";</style>`;
    const opts = sveltePreprocess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.dependencies).toContain(
      resolve(__dirname, '..', 'fixtures', 'style.less'),
    );
  });
});
