import { Options, PreprocessorGroup } from '../types';
import { concat, parseFile } from '../utils';

const markupCache: Record<string, string> = {};

export default (options: Options.Typescript): PreprocessorGroup => ({
  markup({ content, filename }: { content: string; filename: string }) {
    markupCache[filename] = content;
    return { code: content };
  },
  async script(svelteFile) {
    const { default: transformer } = await import('../transformers/typescript');
    const { content, filename, lang, dependencies } = await parseFile(
      svelteFile,
      'javascript',
    );
    if (lang !== 'typescript') return { code: content };

    const transformed = await transformer({
      content,
      filename,
      options,
      markup: markupCache[svelteFile.filename],
    });

    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    };
  },
});
