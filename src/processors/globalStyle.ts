import { GenericObject, PreprocessArgs } from '../typings';
import transformer from '../transformers/globalStyle.js';

export default (options: GenericObject) => {
  return {
    style({ content, attributes, filename }: PreprocessArgs) {
      if (!attributes.global) return { code: content };

      return transformer({ content, filename, options });
    },
  };
};
