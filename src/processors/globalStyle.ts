import type { PreprocessorGroup } from '../types';

const globalStyle = (): PreprocessorGroup => {
  return {
    async style({ content, attributes, filename }) {
      const { transformer } = await import('../transformers/globalStyle');

      if (!attributes.global) {
        return { code: content };
      }

      return transformer({ content, filename, attributes });
    },
  };
};

// both for backwards compat with old svelte-preprocess versions
// (was only default export once, now is named export because of transpilation causing node not to detect the named exports of 'svelte-preprocess' otherwise)
export default globalStyle;
export { globalStyle };
