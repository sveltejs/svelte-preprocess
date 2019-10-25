import { GenericObject, PreprocessorGroup } from '../typings';

export default (options: GenericObject): PreprocessorGroup => ({
  async markup({ content, filename }) {
    const { default: transformer } = await import('../transformers/pug');
    return transformer({ content, filename, options });
  },
});
