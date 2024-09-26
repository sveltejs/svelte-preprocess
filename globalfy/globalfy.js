import { ast, createParser, render } from "css-selector-parser"

function globalfyNode(node, opts) {
  if (!node || !node.type) {
    return node
  }

  const {types, exclude} = opts

  // First base case: node must be globalfied.
  if (exclude ? !types.includes(node.type) : types.includes(node.type)) {
    return {
      name: "global",
      type: "PseudoClass",
      argument: {
        type: "Selector",
        rules: [{type: "Rule", items: [node]}],
      },
    }
  }

  // For composite nodes, recursively globalfy their children.
  switch (node.type) {
    case "Selector":
      return {
        ...node,
        rules: node.rules.map((rule) => globalfyNode(rule, opts)),
      }
    case "Rule":
      return {
        ...node,
        nestedRule: node.nestedRule ? globalfyNode(node.nestedRule, opts) : null,
        // items: node.items.map((child) => globalfyNode(child, opts)),
        items: [{
          name: "global",
          type: "PseudoClass",
          argument: {
            type: "Selector",
            rules: [{type: "Rule", items: node.items}],
          },
        }],
      }
    case "PseudoClass":
    case "PseudoElement":
      return {
        ...node,
        argument: globalfyNode(node.argument, opts),
      }
  }

  // Second base case: node is not composite and doesn't need to be globalfied.
  return node
}

function globalfySelector(selector, opts) {
  const parse = createParser({syntax: "progressive"});
  return render(ast.selector(globalfyNode(parse(selector), opts)))
}

const AST = process.argv[2] == "ast"
const STRAT1 = {types: ["Selector"], exclude: true}
const STRAT2 = {types: ["Selector", "Rule"], exclude: true}

function debugAST(selector) {
  const parse = createParser({strict: false, syntax: "progressive"})
  const output = parse(selector)
  console.log(JSON.stringify(output, null, 2))
  console.log(render(ast.selector(output)))
}

function debugGlobalfy(selector) {
  console.log(`   input:  ${selector}`)
  console.log(`  STRAT1:  ${globalfySelector(selector, STRAT1)}`)
  console.log(`  STRAT2:  ${globalfySelector(selector, STRAT2)}`)
  console.log()
}

if (AST) {
  debugAST(".foo")
  debugAST(".foo > .bar")
  debugAST(".foo .bar")
  debugAST(".foo.bar")
  // debugAST(":global(.foo > .bar)")
  // debugAST(".first .second")
  // debugAST("test > .first, .second)")
  // debugAST("#foo > .bar + div.k1.k2 [id='baz']:hello(2):not(:where(#yolo))::before")
} else {
  [
    ".foo",
    "ul + p",
    "p, a",
    "p > a",
    "p + p",
    "li a",
    "div ~ a",
    "div, a",
    ".foo.bar",
    "[attr=\"with spaces\"]",
    "article :is(h1, h2)",
    "tr:nth-child(2n+1)",
    "p:nth-child(n+8):nth-child(-n+15)",
    "#foo > .bar + div.k1.k2 [id='baz']:not(:where(#yolo))::before"
  ].forEach((selector) => debugGlobalfy(selector))
}