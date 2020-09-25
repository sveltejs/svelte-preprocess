import { globalifySelector } from '../../src/modules/globalifySelector';

describe('globalifySelector', () => {
  it('correctly treats CSS selectors with legal spaces', async () => {
    const selector = '[attr="with spaces"]';

    expect(globalifySelector(selector)).toEqual(
      ':global([attr="with spaces"])',
    );
  });

  it('works with combinators', async () => {
    expect(globalifySelector('ul + p')).toEqual(`:global(ul) + :global(p)`);
    expect(globalifySelector('p > a')).toEqual(`:global(p) > :global(a)`);
    expect(globalifySelector('p + p')).toEqual(`:global(p) + :global(p)`);
    expect(globalifySelector('li a')).toEqual(`:global(li) :global(a)`);
    expect(globalifySelector('div ~ a')).toEqual(`:global(div) ~ :global(a)`);
    expect(globalifySelector('div, a')).toEqual(`:global(div), :global(a)`);
  });

  it('correctly treats selectors with escaped combinator characters', async () => {
    const selector1 = '.\\~positive.\\!normal ~ .\\+foo';

    expect(globalifySelector(selector1)).toEqual(
      ':global(.\\~positive.\\!normal) ~ :global(.\\+foo)',
    );
  });

  it('works with nth-child', async () => {
    expect(globalifySelector('tr:nth-child(odd)')).toEqual(
      `:global(tr:nth-child(odd))`,
    );
    expect(globalifySelector('tr:nth-child(2n+1)')).toEqual(
      `:global(tr:nth-child(2n+1))`,
    );
    expect(globalifySelector('tr:nth-child(even)')).toEqual(
      `:global(tr:nth-child(even))`,
    );
    expect(globalifySelector('tr:nth-child(2n)')).toEqual(
      `:global(tr:nth-child(2n))`,
    );
    expect(globalifySelector(':nth-child(7)')).toEqual(
      `:global(:nth-child(7))`,
    );
    expect(globalifySelector(':nth-child(5n)')).toEqual(
      `:global(:nth-child(5n))`,
    );
    expect(globalifySelector(':nth-child(n+7)')).toEqual(
      `:global(:nth-child(n+7))`,
    );
    expect(globalifySelector(':nth-child(3n+4)')).toEqual(
      `:global(:nth-child(3n+4))`,
    );
    expect(globalifySelector(':nth-child(-n+3)')).toEqual(
      `:global(:nth-child(-n+3))`,
    );
    expect(globalifySelector('p:nth-child(n)')).toEqual(
      `:global(p:nth-child(n))`,
    );
    expect(globalifySelector('p:nth-child(1)')).toEqual(
      `:global(p:nth-child(1))`,
    );
    expect(globalifySelector('p:nth-child(0n+1)')).toEqual(
      `:global(p:nth-child(0n+1))`,
    );
    expect(globalifySelector('p:nth-child(n+8):nth-child(-n+15)')).toEqual(
      `:global(p:nth-child(n+8):nth-child(-n+15))`,
    );
  });
});
