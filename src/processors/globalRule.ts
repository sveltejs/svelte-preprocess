import { PreprocessorGroup } from '../types';

export default (): PreprocessorGroup => {
  return {
    async style({ content, filename }) {
      const { default: transformer } = await import(
        '../transformers/globalRule'
      );

      return transformer({ content, filename });
    },
  };
};
