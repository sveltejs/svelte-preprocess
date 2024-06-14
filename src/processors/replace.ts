import type { PreprocessorGroup, Options } from '../types';

const replace = (options: Options.Replace): PreprocessorGroup => ({
  async markup({ content, filename }) {
    const { transformer } = await import('../transformers/replace');

    return transformer({ content, filename, options });
  },
});

// both for backwards compat with old svelte-preprocess versions
// (was only default export once, now is named export because of transpilation causing node not to detect the named exports of 'svelte-preprocess' otherwise)
export default replace;
export { replace };
