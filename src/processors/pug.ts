import transformer from '../transformers/pug';

export default (options: GenericObject) => ({
  markup({ content, filename }: PreprocessArgs) {
    return transformer({ content, filename, options });
  },
});
