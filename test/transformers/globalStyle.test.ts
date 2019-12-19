import autoProcess from '../../src';
import { preprocess } from '../utils';

describe('transformer - globalStyle', () => {
  it('wraps selector in :global(...) modifier', async () => {
    const template = `<style global>div{color:red}.test{}</style>`;
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);
    expect(preprocessed.toString()).toContain(
      `:global(div){color:red}:global(.test){}`,
    );
  });

  it('wraps selector in :global(...) only if needed', async () => {
    const template = `<style global>.test{}:global(.foo){}</style>`;
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);
    expect(preprocessed.toString()).toContain(
      `:global(.test){}:global(.foo){}`,
    );
  });

  it("prefixes @keyframes names with '-global-' only if needed", async () => {
    const template = `<style global>
@keyframes a {from{} to{}}@keyframes -global-b {from{} to{}}
</style>`;
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);
    expect(preprocessed.toString()).toContain(
      `@keyframes -global-a {from{} to{}}@keyframes -global-b {from{} to{}}`,
    );
  });

  it('allows to use :local() at the beginning of a selector', async () => {
    const template = `<style global>:local(div) .test{}</style>`;
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);
    expect(preprocessed.toString()).toContain(`div :global(.test){}`);
  });

  it('allows to use :local() in the middle of a selector', async () => {
    const template = `<style global>.test :local(div) .test{}</style>`;
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);
    expect(preprocessed.toString()).toContain(
      `:global(.test) div :global(.test){}`,
    );
  });

  it('allows to use :local() in the end of a selector', async () => {
    const template = `<style global>.test :local(div){}</style>`;
    const opts = autoProcess();
    const preprocessed = await preprocess(template, opts);
    expect(preprocessed.toString()).toContain(`:global(.test) div{}`);
  });
});
