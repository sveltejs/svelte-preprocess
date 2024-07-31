import * as parsel from "parsel-js"

function globalfyNode(node, opts) {
  const {types, exclude} = opts

  // First base case: node must be globalfied.
  if (exclude ? !types.includes(node.type) : types.includes(node.type)) {
    const arg = parsel.stringify(node)
    return {
      "name": "global",
      "argument": arg,
      "type": "pseudo-class",
      "content": `:global(${arg})`
    }
  }

  // For composite nodes, recursively globalfy their children.
  switch (node.type) {
    case "compound":
    case "list":
      console.log("list")
      let x = {
        ...node,
        list: node.list.map((child) => globalfyNode(child, opts)),
      }
      console.log(JSON.stringify(x, null, 2))
      return x
    case "complex":
      console.log("complex")
      let y = {
        ...node,
        left: globalfyNode(node.left, opts),
        right: globalfyNode(node.right, opts),
      }
      console.log(JSON.stringify(y, null, 2))
      return y
  }

  // Second base case: node is not composite and doesn't need to be globalfied.
  return node
}

function globalfySelector(selector, opts) {
  console.log("gns")
  console.log(JSON.stringify(JSON.parse(JSON.stringify(parsel.parse(selector))), null, 2))
  return parsel.stringify(globalfyNode(JSON.parse(JSON.stringify(parsel.parse(selector))), opts))
}

// const TYPES = [
//   "list",
//   "complex",
//   "compound",
//   "id",
//   "class",
//   "comma",
//   "combinator",
//   "pseudo-element",
//   "pseudo-class",
//   "universal",
//   "type",
// ]

const AST = process.argv[2] == "ast"
const STRAT1 = {types: ["list", "complex", "compound"], exclude: true}
const STRAT2 = {types: ["class", "id", "type"]}

function debugAST(input) {
  if (typeof input === "string") {
    input = parsel.parse(input)
  }
  console.log(JSON.stringify(input, null, 2))
  console.log(parsel.stringify(input))
}

function debugGlobalfy(selector, opts) {
  console.log(`   input:  ${selector}`)
  console.log(`  output:  ${globalfySelector(selector, opts)}`)
  console.log()
}

if (AST) {
  // debugAST(".foo")
  debugAST(".foo > .bar")
  // debugAST(":global(.foo, .foo.bar)")
  // debugAST(".first .second")
  // debugAST("test > .first, .second)")
  // debugAST("#foo > .bar + div.k1.k2 [id='baz']:hello(2):not(:where(#yolo))::before")
} else {
  // debugGlobalfy(".foo", STRAT1)
  debugGlobalfy(".foo > .bar", STRAT1)
  // debugGlobalfy(".foo > .bar", STRAT1)
}
