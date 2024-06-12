import { describe, it, expect, vi, afterAll } from 'vitest';
import sveltePreprocess from '../../src';
import { preprocess } from '../utils';
import { transformer as babelTransformer } from '../../src/transformers/babel';
import { transformer as coffeeTransformer } from '../../src/transformers/coffeescript';
import { transformer as globalStyleTransformer } from '../../src/transformers/globalStyle';
import { transformer as lessTransformer } from '../../src/transformers/less';
import { transformer as postcssTransformer } from '../../src/transformers/postcss';
import { transformer as scssTransformer } from '../../src/transformers/scss';
import { transformer as stylusTransformer } from '../../src/transformers/stylus';
import { transformer as typescriptTransformer } from '../../src/transformers/typescript';
import { SOURCE_MAP_PROP_MAP } from '../../src/modules/language';
import { setProp } from '../../src/modules/utils';

const TRANSFORMERS: Record<string, any> = {
  babel: {
    transformer: babelTransformer,
    template: `<script>console.log('potato')</script>`,
  },
  typescript: {
    transformer: typescriptTransformer,
    template: `<script lang="ts">console.log('potato')</script>`,
  },
  coffeescript: {
    transformer: coffeeTransformer,
    template: `<script lang="coffee">console.log('potato')</script>`,
  },
  scss: {
    transformer: scssTransformer,
    template: `<style lang="scss">div{}</style>`,
  },
  less: {
    transformer: lessTransformer,
    template: `<style lang="less">div{}</style>`,
  },
  stylus: {
    transformer: stylusTransformer,
    template: `<style lang="stylus">div{}</style>`,
  },
  postcss: {
    transformer: postcssTransformer,
    template: `<style>div{}</style>`,
  },
  globalStyle: {
    transformer: globalStyleTransformer,
    template: `<style>div{}</style>`,
  },
};

// todo: is there a better way to do this?
vi.mock(`../../src/transformers/babel`, () => ({
  transformer: vi.fn(() => ({ code: '' })),
}));
vi.mock(`../../src/transformers/typescript`, () => ({
  transformer: vi.fn(() => ({ code: '' })),
}));
vi.mock(`../../src/transformers/coffeescript`, () => ({
  transformer: vi.fn(() => ({ code: '' })),
}));
vi.mock(`../../src/transformers/scss`, () => ({
  transformer: vi.fn(() => ({ code: '' })),
}));
vi.mock(`../../src/transformers/less`, () => ({
  transformer: vi.fn(() => ({ code: '' })),
}));
vi.mock(`../../src/transformers/stylus`, () => ({
  transformer: vi.fn(() => ({ code: '' })),
}));
vi.mock(`../../src/transformers/postcss`, () => ({
  transformer: vi.fn(() => ({ code: '' })),
}));
vi.mock(`../../src/transformers/globalStyle`, () => ({
  transformer: vi.fn(() => ({ code: '' })),
}));

afterAll(() => {
  vi.resetAllMocks();
});

describe(`sourcemap generation`, () => {
  Object.entries(TRANSFORMERS).forEach(
    ([transformerName, { transformer, template }]) => {
      it(`${transformerName} - pass the appropriate source map option downwards to the transformer`, async () => {
        const opts = sveltePreprocess({
          sourceMap: true,
          [transformerName]: true,
        });

        const expectedOptions = {};

        setProp(expectedOptions, ...SOURCE_MAP_PROP_MAP[transformerName]);

        await preprocess(template, opts);

        expect(transformer).toHaveBeenCalledWith(
          expect.objectContaining({
            options: expect.objectContaining(expectedOptions),
          }),
        );
      });
    },
  );
});
