import { babel } from '../../src';
import { preprocess } from '../utils';

describe(`processor - babel`, () => {
  it('should support external src files', async () => {
    const template = `<script src="./fixtures/script.babel.js"></script><div></div>`;
    const preprocessed = await preprocess(template, [
      babel({
        presets: [
          [
            '@babel/preset-env',
            {
              loose: true,
              modules: false,
              targets: {
                esmodules: true,
              },
            },
          ],
        ],
      }),
    ]);

    expect(preprocessed.toString?.()).toMatchInlineSnapshot(`
      "<script src=\\"./fixtures/script.babel.js\\">export var hello = {};
      export var world = hello == null ? void 0 : hello.value;</script><div></div>"
    `);
  });
});
