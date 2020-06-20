import getAutoPreprocess from '../../src';
import { preprocess } from '../utils';

describe('transformer - twig', () => {
  it('should correctly render', async () => {
    const template = `<template lang="twig"><h1>{{"twig"|upper}}</h1></template>`;
    const opts = getAutoPreprocess();
    const preprocessed = await preprocess(template, opts);

    expect(preprocessed.code).toBe('<h1>TWIG</h1>');
  });
});
