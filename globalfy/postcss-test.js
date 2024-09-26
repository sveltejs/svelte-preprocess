import postcss from "postcss"

// Sample CSS
const css = `
h1, h2 {
  color: blue;
}
h3 {
  color: red;
}
`;

// Process the CSS
postcss()
  .use(root => {
    root.walkRules(rule => {
      console.log(`Rule: ${rule.selector}`);
      // Splitting the selector by commas to check for multiple selectors
      for (let s in rule.selectors) {
        console.log(`selector: ${s}`)
      }
      if (rule.selectors.length > 1) {
        console.log('This rule has multiple selectors:', rule.selectors);
      } else {
        console.log('This rule has a single selector:', rule.selectors[0]);
      }
    });
  })
  .process(css, { from: undefined })
  .then(result => {
    console.log('Processing complete.');
  });
