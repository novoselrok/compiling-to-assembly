import {parser} from './parser'
import {
    AssignNode,
    BlockNode,
    FunctionNode,
    IdentifierNode,
    MultiplyNode,
    NotEqualNode,
    NumberNode,
    ReturnNode,
    SubtractNode,
    VarNode,
    WhileNode
} from './ast'

const source = `
function factorial(n) {
    var result = 1;
    while (n != 1) {
        result = result * n;
        n = n - 1;
    }
    return result;
}`

const expected = new BlockNode([
    new FunctionNode("factorial", ["n"], new BlockNode([
        new VarNode("result", new NumberNode(1)),
        new WhileNode(new NotEqualNode(new IdentifierNode("n"),
            new NumberNode(1)), new BlockNode([
            new AssignNode("result", new MultiplyNode(new IdentifierNode("result"),
                new IdentifierNode("n"))),
            new AssignNode("n", new SubtractNode(new IdentifierNode("n"),
                new NumberNode(1))),
        ])),
        new ReturnNode(new IdentifierNode("result")),
    ])),
]);

console.log(parser.parseStringToCompletion(source).equals(expected))
