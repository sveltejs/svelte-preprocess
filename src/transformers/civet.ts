import { isAbsolute, resolve } from 'path';

import { compile } from '@danielx/civet';

import { transformer as tsTransform } from './typescript';

import type { Options, Transformer } from '../types';

const transformer: Transformer<Options.Typescript> = async ({
  content,
  filename,
  markup,
  options = {},
  attributes,
}) => {
  const basePath = process.cwd();

  if (filename == null) return { code: content };

  filename = isAbsolute(filename) ? filename : resolve(basePath, filename);

  const { code, sourceMap } = compile(content, {
    filename,
    js: false,
    sourceMap: true,
  });

  return tsTransform({
    content: code,
    attributes,
    filename,
    map: sourceMap.json(filename, filename) as object,
    markup,
    options,
  });
};

export { transformer };
