# Globalfy

This is just a test directory for me to figure out how to improve the global-fication of css in this project.

Remove this before finishing PR.

## Notes

- parsel didn't work for me... it parses fine but then cannot convert AST back into a selector after modification. The stringify "helper" just smushes the tokens together omitting combinators, commas, and everything else.
- I tried `css-selector-parser` and it works great. In postcss's terms, `h1, h2` is a rule made up of two selectors, `h1` and `h2`. Since `svelte-preprocess` calls `globalifySelector` on each individual selector (i.e., `rule.selectors.map(globalifySelector)`), that means we don't actually need to worry about parsing the top-level rule into selectors. However, `css-selector-parser` does do it perfectly well, so I designed it to handle both cases.
- The terminology is a little different in `css-selector-parser`. In their lingo, a selector is the top level thing, and it is composed of `rules`.

I tested two strategies (using `css-selector-parser` terminology):
1. Wrap selector rules in `:global()` (i.e., `p > a` -> `:global(p > a)`).
2. Recurse deeper and wrap each rule individually in `:global()` (i.e., `p > a` -> `:global(p) > :global(a)`).

Strategy 2 seems more in line with what is normal right now. However, I don't really understand this, and I prefer Strategy 1. The only constraint I've seen from Svelte is from the error that was the genesis of my work on this: `:global(...) must contain a single selector`. This seems to suggest that the most reasonable thing to do (and which is also faster) is to wrap the entire selector in `:global()`. In other words, Svelte is saying you cannot do `:global(p, a)` (fine), but you can do `:global(p > a)`, since the former is two selectors and the latter is a single selector.

Here is the output of `node ./globalfy.js`:

```txt
   input:  .foo
  STRAT1:  :global(.foo)
  STRAT2:  :global(.foo)

   input:  ul + p
  STRAT1:  :global(ul + p)
  STRAT2:  :global(ul) + :global(p)

   input:  p, a
  STRAT1:  :global(p), :global(a)
  STRAT2:  :global(p), :global(a)

   input:  p > a
  STRAT1:  :global(p > a)
  STRAT2:  :global(p) > :global(a)

   input:  p + p
  STRAT1:  :global(p + p)
  STRAT2:  :global(p) + :global(p)

   input:  li a
  STRAT1:  :global(li a)
  STRAT2:  :global(li) :global(a)

   input:  div ~ a
  STRAT1:  :global(div ~ a)
  STRAT2:  :global(div) ~ :global(a)

   input:  div, a
  STRAT1:  :global(div), :global(a)
  STRAT2:  :global(div), :global(a)

   input:  .foo.bar
  STRAT1:  :global(.foo.bar)
  STRAT2:  :global(.foo.bar)

   input:  [attr="with spaces"]
  STRAT1:  :global([attr="with spaces"])
  STRAT2:  :global([attr="with spaces"])

   input:  article :is(h1, h2)
  STRAT1:  :global(article :is(h1, h2))
  STRAT2:  :global(article) :global(:is(h1, h2))

   input:  tr:nth-child(2n+1)
  STRAT1:  :global(tr:nth-child(2n+1))
  STRAT2:  :global(tr:nth-child(2n+1))

   input:  p:nth-child(n+8):nth-child(-n+15)
  STRAT1:  :global(p:nth-child(n+8):nth-child(-n+15))
  STRAT2:  :global(p:nth-child(n+8):nth-child(-n+15))

   input:  #foo > .bar + div.k1.k2 [id='baz']:not(:where(#yolo))::before
  STRAT1:  :global(#foo > .bar + div.k1.k2 [id="baz"]:not(:where(#yolo))::before)
  STRAT2:  :global(#foo) > :global(.bar) + :global(div.k1.k2) :global([id="baz"]:not(:where(#yolo))::before)
```