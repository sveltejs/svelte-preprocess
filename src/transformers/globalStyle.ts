const postcss = require('postcss');

import { Transformer } from '../typings';

const globalifyPlugin = (root: any) => {
  root.walkAtRules(/keyframes$/, (atrule: any) => {
    if (!atrule.params.startsWith('-global-')) {
      atrule.params = '-global-' + atrule.params;
    }
  });

  root.walkRules((rule: any) => {
    if (rule.parent && rule.parent.name === 'keyframes') {
      return;
    }

    rule.selectors = rule.selectors.map((selector: string) =>
      selector.startsWith(':global') ? selector : `:global(${selector})`,
    );
  });
};

const transformer: Transformer = async ({
  content,
  filename,
  map = undefined,
}) => {
  const { css, map: newMap } = await postcss()
    .use(globalifyPlugin)
    .process(content, { from: filename, prev: map });

  return { code: css, map: newMap };
};

export default transformer;
