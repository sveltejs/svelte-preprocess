import { resolve } from 'path';

import getAutoPreprocess from '../../src';
import { preprocess } from '../utils';

describe('transformer - less', () => {
  // TODO: waiting for https://github.com/less/less.js/issues/3508
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should return @imported files as dependencies', async () => {
    const template = `<style lang="less">@import "fixtures/style.less";</style>`;
    const opts = getAutoPreprocess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.dependencies).toContain(
      resolve(__dirname, '..', 'fixtures', 'style.less'),
    );
  });
});
