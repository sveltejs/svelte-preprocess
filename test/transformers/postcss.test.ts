/* eslint-disable node/global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
import { resolve } from 'path';

import sveltePreprocess from '../../src';
import { preprocess, spyConsole } from '../utils';
import { transformer } from '../../src/transformers/postcss';

spyConsole({ silent: true });

test('transformer returns source map', async () => {
  const content = 'div{color:red}';
  const filename = '/file';
  const options = {
    plugins: [
      require('autoprefixer')({
        overrideBrowserslist: 'Safari >= 5.1',
      }),
    ],
  };

  const { map } = await transformer({ content, filename, options });

  expect(map).toBeTruthy();
});

test('should not transform plain css with postcss if { postcss: falsy }', async () => {
  const template = `<div></div><style>div{appearance:none;}</style>`;
  const preprocessed = await preprocess(template, sveltePreprocess());

  expect(preprocessed.toString?.()).not.toMatch(/-webkit-/);
});

test('should not transform plain css with postcss if { postcss: true } and no configuration file at cwd', async () => {
  const template = `<div></div><style>div{appearance:none;}</style>`;
  const preprocessed = await preprocess(
    template,
    sveltePreprocess({
      postcss: true,
    }),
  );

  expect(preprocessed.toString?.()).not.toMatch(/-webkit-/);
});

test('should transform plain css with postcss if { postcss: { plugins... } }', async () => {
  const template = `<div></div><style>div{appearance:none;}</style>`;
  const optsWithoutConfigFile = sveltePreprocess({
    postcss: {
      plugins: [
        require('autoprefixer')({
          overrideBrowserslist: 'Safari >= 5.1',
        }),
      ],
    },
  });

  const preprocessed = await preprocess(template, optsWithoutConfigFile);

  expect(preprocessed.toString?.()).toMatch(/-webkit-/);
});

test('should transform async preprocessed css with postcss if { postcss: { plugins... } }', async () => {
  const templateSass = `<div></div><style lang="scss">div{appearance:none;}</style>`;
  const optsWithoutConfigFile = sveltePreprocess({
    postcss: {
      plugins: [
        require('autoprefixer')({
          overrideBrowserslist: 'Safari >= 5.1',
        }),
      ],
    },
  });

  const preprocessed = await preprocess(templateSass, optsWithoutConfigFile);

  expect(preprocessed.toString?.()).toMatch(/-webkit-/);
});

test('should transform plain css with postcss if { postcss: { configFilePath: ... } }', async () => {
  const template = `<div></div><style>div{appearance:none;}</style>`;
  const preprocessed = await preprocess(
    template,
    sveltePreprocess({
      postcss: {
        configFilePath: './test/fixtures/',
      },
    }),
  );

  expect(preprocessed.toString?.()).toMatch(/-webkit-/);
});

test('should return @imported files as dependencies', async () => {
  const template = `<style>@import './fixtures/style.css';</style>`;
  const opts = sveltePreprocess({
    postcss: {
      plugins: [require('postcss-easy-import')],
    },
  });

  const preprocessed = await preprocess(template, opts);

  expect(preprocessed.dependencies).toContain(
    resolve(__dirname, '..', 'fixtures', 'style.css'),
  );
});

test('should allow custom postcss parsers', async () => {
  const template = `<style>
div
  color: red
</style>`;

  const opts = sveltePreprocess({
    postcss: {
      parser: require('sugarss'),
      plugins: [require('postcss-easy-import')],
    },
  });

  const preprocessed = await preprocess(template, opts);

  expect(preprocessed.toString?.()).toMatchInlineSnapshot(`
      "<style>
      div {
        color: red
      }</style>"
    `);
});

test('automatically removes indentation for lang=sugarss', async () => {
  const template = `<style lang="sugarss">
      div
        color: red
    </style>`;

  const opts = sveltePreprocess({
    postcss: true,
  });

  const preprocessed = await preprocess(template, opts);

  expect(preprocessed.toString?.()).toMatchInlineSnapshot(`
      "<style lang=\\"sugarss\\">
      div {
        color: red
      }</style>"
    `);
});

test('should not override postcss with custom style language', async () => {
  const custom = jest.fn(({ content }) => ({ code: content }));
  const postcss = jest.fn(({ content }) => ({ code: content }));
  const opts = sveltePreprocess({ custom, postcss });

  await preprocess(
    `<div></div><style lang="custom">div{color:red}</style>`,
    opts,
  );

  expect(custom).toHaveBeenCalledTimes(1);
  expect(postcss).toHaveBeenCalledTimes(1);
});

test('should execute postcss alias override before postcss', async () => {
  const sugarss = jest.fn(({ content }) => ({ code: content }));
  const postcss = jest.fn(({ content }) => ({ code: content }));
  const opts = sveltePreprocess({ sugarss, postcss });

  await preprocess(
    `<div></div><style lang="sugarss">div{color:red}</style>`,
    opts,
  );

  expect(sugarss).toHaveBeenCalledTimes(1);
  expect(postcss).toHaveBeenCalledTimes(1);
});
