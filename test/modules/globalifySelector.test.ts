import { globalifySelector } from '../../src/modules/globalifySelector';

describe('globalifySelector', () => {
  it('correctly treats CSS selectors with legal spaces', async () => {
    const selector = '[attr="with spaces"]';

    expect(globalifySelector(selector)).toBe(':global([attr="with spaces"])');
  });

  it('works with combinators', async () => {
    expect(globalifySelector('ul + p')).toBe(`:global(ul) + :global(p)`);
    expect(globalifySelector('p > a')).toBe(`:global(p) > :global(a)`);
    expect(globalifySelector('p + p')).toBe(`:global(p) + :global(p)`);
    expect(globalifySelector('li a')).toBe(`:global(li) :global(a)`);
    expect(globalifySelector('div ~ a')).toBe(`:global(div) ~ :global(a)`);
    expect(globalifySelector('div, a')).toBe(`:global(div), :global(a)`);
  });

  it('correctly treats selectors with escaped combinator characters', async () => {
    const selector1 = '.\\~positive.\\!normal ~ .\\+foo';

    expect(globalifySelector(selector1)).toBe(
      ':global(.\\~positive.\\!normal) ~ :global(.\\+foo)',
    );
  });

  it('works with nth-child', async () => {
    expect(globalifySelector('tr:nth-child(odd)')).toBe(
      `:global(tr:nth-child(odd))`,
    );
    expect(globalifySelector('tr:nth-child(2n+1)')).toBe(
      `:global(tr:nth-child(2n+1))`,
    );
    expect(globalifySelector('tr:nth-child(even)')).toBe(
      `:global(tr:nth-child(even))`,
    );
    expect(globalifySelector('tr:nth-child(2n)')).toBe(
      `:global(tr:nth-child(2n))`,
    );
    expect(globalifySelector(':nth-child(7)')).toBe(`:global(:nth-child(7))`);
    expect(globalifySelector(':nth-child(5n)')).toBe(`:global(:nth-child(5n))`);
    expect(globalifySelector(':nth-child(n+7)')).toBe(
      `:global(:nth-child(n+7))`,
    );
    expect(globalifySelector(':nth-child(3n+4)')).toBe(
      `:global(:nth-child(3n+4))`,
    );
    expect(globalifySelector(':nth-child(-n+3)')).toBe(
      `:global(:nth-child(-n+3))`,
    );
    expect(globalifySelector('p:nth-child(n)')).toBe(`:global(p:nth-child(n))`);
    expect(globalifySelector('p:nth-child(1)')).toBe(`:global(p:nth-child(1))`);
    expect(globalifySelector('p:nth-child(0n+1)')).toBe(
      `:global(p:nth-child(0n+1))`,
    );
    expect(globalifySelector('p:nth-child(n+8):nth-child(-n+15)')).toBe(
      `:global(p:nth-child(n+8):nth-child(-n+15))`,
    );
  });
});
