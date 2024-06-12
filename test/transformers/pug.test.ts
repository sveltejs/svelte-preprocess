import { resolve } from 'path';
import { describe, it, expect } from 'vitest';
import sveltePreprocess from '../../src';
import { preprocess } from '../utils';

describe('transformer - pug', () => {
  it('should de-indent if necessary', async () => {
    const template = `<template lang="pug">
  main
    header
      h1</template>`;

    const opts = sveltePreprocess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.code).toBe('<main><header><h1></h1></header></main>');
  });

  it('should correctly prepend mixins with space TABS', async () => {
    const template = `<template lang="pug">
main
  header
    h1</template>`;

    const opts = sveltePreprocess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.code).toBe('<main><header><h1></h1></header></main>');
  });

  it('should correctly prepend mixins with regular TABS', async () => {
    const template = `<template lang="pug">
main
\theader
\t\th1</template>`;

    const opts = sveltePreprocess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.code).toBe('<main><header><h1></h1></header></main>');
  });

  it('should return included files as dependencies', async () => {
    const template = `<template lang="pug">include ./fixtures/template.pug</template>`;
    const opts = sveltePreprocess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.dependencies).toContain(
      resolve(__dirname, '..', 'fixtures', 'template.pug'),
    );
  });

  it('supports spread between quotes', async () => {
    const template = `
<template lang="pug">
button.big(
  type="button"
  disabled
  "{...slide.props}"
  "{...$$restProps}"
) Send
</template>`;

    const opts = sveltePreprocess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.code).toMatch(
      `<button class="big" type="button" disabled {...slide.props} {...$$restProps}>Send</button>`,
    );
  });
});
