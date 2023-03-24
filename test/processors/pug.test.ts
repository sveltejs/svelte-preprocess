import { pug } from '../../src';
import { getFixtureContent, getFixturePath, preprocess } from '../utils';

const EXPECTED = {
  BASIC: getFixtureContent('pug/basic.html'),
  MIXIN: getFixtureContent('pug/mixin.html'),
  TEMPLATE: getFixtureContent('pug/template.html'),
};

describe(`processor - pug`, () => {
  it('should preprocess the whole file', async () => {
    const template = getFixtureContent('pug/basic.pug');
    const preprocessed = await preprocess(template, [pug()]);

    expect(preprocessed.toString?.()).toContain(EXPECTED.BASIC);
  });

  it('should support prepended data', async () => {
    const template = ``;
    const options = { prependData: `// potato` };
    const preprocessed = await preprocess(template, [pug(options)]);

    expect(preprocessed.toString?.()).toContain(`<!-- potato-->`);
  });

  it('should support template tag wrapper', async () => {
    const template = `<markup>
h1 HEY
</markup>`;

    const options = { markupTagName: `markup` };
    const preprocessed = await preprocess(template, [pug(options)]);

    expect(preprocessed.toString?.()).toContain(`<h1>HEY</h1>`);
  });

  it('should support mixins', async () => {
    const template = getFixtureContent('pug/mixin.pug');
    const options = { basedir: getFixturePath('.') };
    const preprocessed = await preprocess(template, [pug(options)]);

    expect(preprocessed.toString?.()).toContain(EXPECTED.MIXIN);
  });

  it('should support template inheritance', async () => {
    const template = getFixtureContent('pug/template.pug');
    const options = { basedir: getFixturePath('.') };
    const preprocessed = await preprocess(template, [pug(options)]);

    expect(preprocessed.toString?.()).toContain(EXPECTED.TEMPLATE);
  });
});
