import {
    AddNode, ArrayLiteralNode, ArrayLookupNode,
    AssignNode,
    AST,
    BlockNode, BooleanNode,
    CallNode,
    DivideNode,
    EqualNode,
    FunctionNode,
    IdentifierNode,
    IfNode, LengthNode,
    MultiplyNode,
    NotEqualNode,
    NotNode, NullNode,
    NumberNode,
    ReturnNode,
    SubtractNode,
    VarNode,
    WhileNode
} from './ast'
import {ArrayType, BooleanType, FunctionType, NumberType, Type, VoidType} from './type'

export class Source {
    constructor(public string: string, public index: number) {
    }

    match(regexp: RegExp): (ParseResult<string> | null) {
        // @ts-ignore
        console.assert(regexp.sticky)
        regexp.lastIndex = this.index
        const match = this.string.match(regexp)
        if (match) {
            const value = match[0]
            const newIndex = this.index + value.length
            const source = new Source(this.string, newIndex)
            return new ParseResult(value, source)
        }
        return null
    }
}

class ParseResult<T> {
    constructor(public value: T, public source: Source) {
    }
}

export class Parser<T> {
    constructor(public parse: (_: Source) => (ParseResult<T> | null)) {
    }

    static regexp(regexp: RegExp): Parser<string> {
        return new Parser(source => source.match(regexp))
    }

    static constant<U>(value: U): Parser<U> {
        return new Parser(source => new ParseResult(value, source))
    }

    // TODO: Convert source index into line-column pair and display it together with the line
    static error<U>(message: string): Parser<U> {
        return new Parser(_ => {
            throw Error(message)
        })
    }

    static zeroOrMore<U>(parser: Parser<U>): Parser<Array<U>> {
        return new Parser(source => {
            const results = []
            let item
            while (item = parser.parse(source)) {
                source = item.source
                results.push(item.value)
            }
            return new ParseResult(results, source)
        })
    }

    static maybe<U>(parser: Parser<U>): Parser<U | null> {
        return parser.or(Parser.constant(null))
    }

    bind<U>(callback: (value: T) => Parser<U>): Parser<U> {
        return new Parser(source => {
            const result = this.parse(source)
            return result ? callback(result.value).parse(result.source) : null
        })
    }

    or(parser: Parser<T>): Parser<T> {
        return new Parser(source => {
            const result = this.parse(source)
            return result ? result : parser.parse(source)
        })
    }

    and<U>(parser: Parser<U>): Parser<U> {
        return this.bind(_ => parser)
    }

    map<U>(callback: (t: T) => U): Parser<U> {
        return this.bind(value => Parser.constant(callback(value)))
    }

    parseStringToCompletion(string: string): T {
        const source = new Source(string, 0)
        const result = this.parse(source)
        if (!result) {
            throw Error('Parse error at index 0')
        }

        const index = result.source.index
        if (index !== result.source.string.length) {
            throw Error('Parse error at index ' + index)
        }
        return result.value
    }
}

const {constant, error, regexp, maybe, zeroOrMore} = Parser

const whitespace = regexp(/[ \n\r\t]+/y)
const comments = regexp(/[/][/].*/y).or(regexp(/[/][*].*?[*][/]/sy))
const ignored = zeroOrMore(whitespace.or(comments))

const token = (pattern: RegExp) => regexp(pattern).bind(value => ignored.and(constant(value)))

const FUNCTION = token(/function\b/y)
const IF = token(/if\b/y)
const ELSE = token(/else\b/y)
const RETURN = token(/return\b/y)
const VAR = token(/var\b/y)
const WHILE = token(/while\b/y)
const ARRAY = token(/Array\b/y)
const VOID = token(/void\b/y)
const BOOLEAN = token(/boolean\b/y)
const NUMBER_TOKEN = token(/number\b/y)

const COMMA = token(/[,]/y)
const SEMICOLON = token(/;/y)
const ASSIGN = token(/=/y)
const LEFT_PAREN = token(/[(]/y)
const RIGHT_PAREN = token(/[)]/y)
const LEFT_BRACE = token(/[{]/y)
const RIGHT_BRACE = token(/[}]/y)
const LEFT_BRACKET = token(/[\[]/y)
const RIGHT_BRACKET = token(/[\]]/y)
const LESS_THAN = token(/[<]/y)
const GREATER_THAN = token(/[>]/y)
const COLON = token(/[:]/y)

const TRUE = token(/true\b/y).map(_ => new BooleanNode(true))
const FALSE = token(/false\b/y).map(_ => new BooleanNode(false))
const NULL = token(/null\b/y).map(_ => new NullNode())
const NUMBER = token(/[0-9]+/y).map(digits => new NumberNode(parseInt(digits)))
const ID = token(/[a-zA-Z_][a-zA-Z0-9_]*/y)
const id = ID.map(x => new IdentifierNode(x))

const NOT = token(/!/y).map(_ => NotNode)
const EQUAL = token(/==/y).map(_ => EqualNode)
const NOT_EQUAL = token(/!=/y).map(_ => NotEqualNode)
const PLUS = token(/[+]/y).map(_ => AddNode)
const MINUS = token(/[-]/y).map(_ => SubtractNode)
const STAR = token(/[*]/y).map(_ => MultiplyNode)
const SLASH = token(/[/]/y).map(_ => DivideNode)

const type: Parser<Type> = error('Type parser used before definition')
const arrayType = ARRAY.and(LESS_THAN.and(type.bind(type_ => GREATER_THAN.and(constant(new ArrayType(type_))))))
const typeParser: Parser<Type> = VOID.map(_ => new VoidType())
    .or(BOOLEAN.map(_ => new BooleanType()))
    .or(NUMBER_TOKEN.map(_ => new NumberType()))
    .or(arrayType)
type.parse = typeParser.parse

const expression: Parser<AST> = error('Expression parser used before definition')

const args: Parser<Array<AST>> = expression.bind(
    arg => zeroOrMore(COMMA.and(expression)).bind(
        args => constant([arg, ...args]))).or(constant([]))

const call: Parser<AST> = ID.bind(
    callee => LEFT_PAREN.and(
        args.bind(args_ => RIGHT_PAREN.and(constant(
            callee == 'length' ? new LengthNode(args_[0]) : new CallNode(callee, args_))))))

const boolean: Parser<AST> = TRUE.or(FALSE)

const scalar: Parser<AST> = boolean.or(NULL).or(id).or(NUMBER)

const arrayLiteral = LEFT_BRACKET.and(args.bind(
    args_ => RIGHT_BRACKET.and(constant(new ArrayLiteralNode(args_)))))

const arrayLookup = id.bind(
    array_ => LEFT_BRACKET.and(expression.bind(
        index => RIGHT_BRACKET.and(constant(new ArrayLookupNode(array_, index))))))

const atom: Parser<AST> = call.or(arrayLiteral).or(arrayLookup).or(scalar).or(
    LEFT_PAREN.and(expression).bind(e => RIGHT_PAREN.and(constant(e))))

const unary: Parser<AST> = maybe(NOT).bind(
    not_ => atom.map(term => not_ ? new NotNode(term) : term))

const infix = (operatorParser: Parser<any>, termParser: Parser<any>) => termParser.bind(
    term => zeroOrMore(
        operatorParser.bind(operator => termParser.bind(term => constant({operator, term})))
    ).map(operatorTerms => operatorTerms.reduce((left, {operator, term}) => new operator(left, term), term)))

const product = infix(STAR.or(SLASH), unary)

const sum = infix(PLUS.or(MINUS), product)

const comparison = infix(EQUAL.or(NOT_EQUAL), sum)

expression.parse = comparison.parse

const statement: Parser<AST> = error('Statement parser used before definition')

const returnStatement: Parser<AST> = RETURN.and(expression).bind(
    term => SEMICOLON.and(constant(new ReturnNode(term))))

const expressionStatement: Parser<AST> = expression.bind(term => SEMICOLON.and(constant(term)))

const ifStatement: Parser<AST> = IF.and(LEFT_PAREN).and(expression).bind(
    conditional => RIGHT_PAREN.and(statement).bind(
        consequence => ELSE.and(statement).bind(
            alternative => constant(new IfNode(conditional, consequence, alternative)))))

const whileStatement: Parser<AST> = WHILE.and(LEFT_PAREN).and(expression).bind(
    conditional => RIGHT_PAREN.and(statement).bind(
        body => constant(new WhileNode(conditional, body))))

const varStatement: Parser<AST> = VAR.and(ID).bind(
    name => ASSIGN.and(expression).bind(
        value => SEMICOLON.and(constant(new VarNode(name, value)))))

const assignmentStatement: Parser<AST> = ID.bind(
    name => ASSIGN.and(expression).bind(
        value => SEMICOLON.and(constant(new AssignNode(name, value)))))

const blockStatement: Parser<AST> = LEFT_BRACE.and(zeroOrMore(statement)).bind(
    statements => RIGHT_BRACE.and(constant(new BlockNode(statements))))

const optionalTypeAnnotation: Parser<Type> = COLON.and(type).or(constant(null))

const parameter: Parser<[string, Type]> = ID.bind(
    param => optionalTypeAnnotation.bind(type_ => constant([param, type_])))

const parameters: Parser<Map<string, Type>> = parameter.bind(
    param => zeroOrMore(COMMA.and(parameter)).bind(
        params => constant(new Map([param, ...params])))).or(constant(new Map()))

const functionStatement: Parser<AST> = FUNCTION.and(ID).bind(
    name => LEFT_PAREN.and(parameters.bind(
        parameters_ => RIGHT_PAREN.and(optionalTypeAnnotation.bind(
            returnType => blockStatement.bind(
                block => constant(
                    new FunctionNode(name, new FunctionType(parameters_, returnType), block))))))))

const statementParser: Parser<AST> =
    returnStatement
        .or(functionStatement)
        .or(ifStatement)
        .or(whileStatement)
        .or(varStatement)
        .or(assignmentStatement)
        .or(blockStatement)
        .or(expressionStatement)

statement.parse = statementParser.parse

export const parser: Parser<AST> = ignored.and(zeroOrMore(statement)).map(statements => new BlockNode(statements))
