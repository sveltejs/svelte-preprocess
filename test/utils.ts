import { readFileSync } from 'fs';
import { resolve } from 'path';
import { vi, afterAll, afterEach } from 'vitest';

import {
  compile as svelteCompile,
  preprocess as sveltePreprocess,
} from 'svelte/compiler';

export const CSS_PATTERN =
  /div(\.svelte-\w{4,7})?\s*\{\s*color:\s*(red|#f00);?\s*\}/;

export const getTestAppFilename = () => resolve(__dirname, 'App.svelte');

export const preprocess = async (input: string, opts: any) =>
  sveltePreprocess(input, opts, { filename: getTestAppFilename() });

const compile = async (input: string, opts: any) => {
  const preprocessed = await exports.preprocess(input, opts);
  const { js, css } = svelteCompile(preprocessed.toString?.(), {
    css: 'injected',
  });

  return { js, css };
};

export const doesCompileThrow = async (input: string, opts: any) => {
  let didThrow = false;

  try {
    await compile(input, opts);
  } catch (err) {
    didThrow = true;
  }

  return didThrow;
};

export const getFixturePath = (file: string) =>
  resolve(__dirname, 'fixtures', file);

export const getFixtureContent = (file: string) =>
  readFileSync(exports.getFixturePath(file)).toString().trim();

export function spyConsole({ silent = true } = {}) {
  const warnSpy = vi.spyOn(global.console, 'warn');
  const errorSpy = vi.spyOn(global.console, 'error');
  const logSpy = vi.spyOn(global.console, 'log');

  if (silent) {
    warnSpy.mockImplementation(() => {});
    errorSpy.mockImplementation(() => {});
    logSpy.mockImplementation(() => {});
  }

  afterAll(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });

  afterEach(() => {
    warnSpy.mockClear();
    errorSpy.mockClear();
    logSpy.mockClear();
  });

  return { warnSpy, errorSpy, logSpy };
}
