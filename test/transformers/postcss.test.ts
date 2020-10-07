/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
import { resolve } from 'path';

import sveltePreprocess from '../../src';
import { preprocess, spyConsole } from '../utils';

spyConsole({ silent: true });

describe('transformer - postcss', () => {
  it('should not transform plain css with postcss if { postcss: falsy }', async () => {
    const template = `<div></div><style>div{appearance:none;}</style>`;
    const preprocessed = await preprocess(template, sveltePreprocess());

    expect(preprocessed.toString()).not.toMatch(/-webkit-/);
  });

  it('should not transform plain css with postcss if { postcss: true } and no configuration file at cwd', async () => {
    const template = `<div></div><style>div{appearance:none;}</style>`;
    const preprocessed = await preprocess(
      template,
      sveltePreprocess({
        postcss: true,
      }),
    );

    expect(preprocessed.toString()).not.toMatch(/-webkit-/);
  });

  it('should transform plain css with postcss if { postcss: { plugins... } }', async () => {
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

    expect(preprocessed.toString()).toMatch(/-webkit-/);
  });

  it('should transform async preprocessed css with postcss if { postcss: { plugins... } }', async () => {
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

    expect(preprocessed.toString()).toMatch(/-webkit-/);
  });

  it('should transform plain css with postcss if { postcss: { configFilePath: ... } }', async () => {
    const template = `<div></div><style>div{appearance:none;}</style>`;
    const preprocessed = await preprocess(
      template,
      sveltePreprocess({
        postcss: {
          configFilePath: './test/fixtures/',
        },
      }),
    );

    expect(preprocessed.toString()).toMatch(/-webkit-/);
  });

  it('should return @imported files as dependencies', async () => {
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

  it('should allow custom postcss parsers', async () => {
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

    expect(preprocessed.toString()).toMatchInlineSnapshot(`
      "<style>
      div {
        color: red
      }</style>"
    `);
  });

  it('should support lang=sugarss without automatic indentation removal', async () => {
    const template = `<style lang="sugarss">
      div
        color: red
    </style>`;

    const opts = sveltePreprocess({
      postcss: {
        plugins: [],
      },
    });

    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.toString()).toMatchInlineSnapshot(`
      "<style lang=\\"sugarss\\">
      div {
        color: red
      }</style>"
    `);
  });
});
