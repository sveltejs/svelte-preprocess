import coffeescript from 'coffeescript';

export default ({
  content,
  filename,
  options,
}: TransformerArgs): PreprocessResult => {
  const { js: code, sourceMap: map } = coffeescript.compile(content, {
    filename,
    sourceMap: true,
    ...options,
  });

  return { code, map };
};
