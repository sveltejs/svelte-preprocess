import { resolve } from 'path';

import { getTestAppFilename, getFixtureContent } from '../utils';
import { getTagInfo } from '../../src/modules/tagInfo';
import {
  importAny,
  getIncludePaths,
  hasDepInstalled,
} from '../../src/modules/utils';

describe('importAny', () => {
  it('should throw error when none exist', () => {
    return expect(importAny('_1', '_2')).rejects.toThrowError(
      'Cannot find any of modules: _1,_2',
    );
  });

  it('should not throw error when any exist', async () => {
    const nodeSass = await import('node-sass');

    expect((await importAny('_1', 'node-sass', '_2')).default).toBe(
      nodeSass.default,
    );
  });
});

describe('getIncludePaths', () => {
  const dummyDir = resolve(process.cwd(), 'src');
  const dummyFile = resolve(dummyDir, 'App.svelte');

  it('should default to cwd, node_modules and current file dirname', () => {
    const paths = getIncludePaths(dummyFile);

    expect(paths).toEqual(
      expect.arrayContaining(['node_modules', process.cwd(), dummyDir]),
    );
  });

  it('should prepend any passed paths via config object', () => {
    const paths = getIncludePaths(dummyFile, ['src']);

    expect(paths).toEqual(
      expect.arrayContaining(['src', 'node_modules', process.cwd(), dummyDir]),
    );
  });

  it('should remove duplicate paths', () => {
    const paths = getIncludePaths(dummyFile, [
      'src',
      'node_modules',
      process.cwd(),
    ]);

    expect(paths).toEqual(['src', 'node_modules', process.cwd(), dummyDir]);
  });
});

describe(`get tag information`, () => {
  it('should only include src files if content is empty', async () => {
    let parsedFile = await getTagInfo({
      content: '',
      markup: '',
      attributes: { src: './fixtures/style.scss' },
      filename: getTestAppFilename(),
    });

    expect(parsedFile.content).toEqual(getFixtureContent('style.scss'));

    parsedFile = await getTagInfo({
      ...parsedFile,
      attributes: { src: './fixtures/style.css' },
    });

    expect(parsedFile.content).toEqual(getFixtureContent('style.scss'));
  });
});

describe('has dependency installed', () => {
  it('should return true if dependency is installed', async () => {
    expect(await hasDepInstalled('svelte')).toBe(true);
  });

  it('should return false if dependency is installed', async () => {
    expect(await hasDepInstalled('potatonator')).toBe(false);
  });
});
