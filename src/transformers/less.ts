import less from 'less';

export default async ({ content, filename, options }: TransformerArgs) => {
  const { css, map, imports } = await less.render(content, {
    sourceMap: {},
    filename,
    ...options,
  });

  return {
    code: css,
    map,
    dependencies: imports,
  };
};
