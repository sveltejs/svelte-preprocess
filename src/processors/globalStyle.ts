import { PreprocessorGroup } from '../types';

export default (): PreprocessorGroup => {
  return {
    async style({ content, attributes, filename }) {
      const { default: transformer } = await import(
        '../transformers/globalStyle'
      );

      if (!attributes.global) {
        return { code: content };
      }

      return transformer({ content, filename, attributes });
    },
  };
};
