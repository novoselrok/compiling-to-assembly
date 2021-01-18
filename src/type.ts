import {
    AddNode,
    ArrayLiteralNode,
    ArrayLookupNode,
    AssignNode,
    BlockNode,
    BooleanNode,
    CallNode,
    DivideNode,
    EqualNode,
    FunctionNode,
    IdentifierNode,
    IfNode, InfixNode,
    LengthNode,
    MultiplyNode,
    NotEqualNode,
    NotNode,
    NullNode, NumberNode, ReturnNode, SubtractNode, VarNode,
    Visitor, WhileNode
} from './ast'

export interface Type {
    equals(other: Type): boolean
    toString(): string
}

function assertType(expected: Type, got: Type): void {
    if (!expected.equals(got)) {
        throw TypeError(`Expected ${expected}, but got ${got}`)
    }
}

export class BooleanType implements Type {
    equals(other: Type): boolean {
        return other instanceof BooleanType
    }

    toString(): string {
        return 'Boolean'
    }
}

export class NumberType implements Type {
    equals(other: Type): boolean {
        return other instanceof NumberType
    }

    toString(): string {
        return 'Number'
    }
}

export class VoidType implements Type {
    equals(other: Type): boolean {
        return other instanceof VoidType
    }

    toString(): string {
        return 'Void'
    }
}

export class ArrayType implements Type {
    constructor(public element: Type | null) {
    }

    equals(other: Type): boolean {
        return other instanceof ArrayType &&
            this.element !== null &&
            other.element !== null &&
            this.element.equals(other.element)
    }

    toString(): string {
        return `Array<${this.element}>`
    }
}

export class FunctionType implements Type {
    constructor(public parameters: Map<string, Type>, public returnType: Type) {
    }

    equals(other: Type): boolean {
        if (!(other instanceof FunctionType) || !this.returnType.equals(other.returnType)) {
            return false
        }
        const paramTypes: Type[] = Array.from(this.parameters.entries()).map(paramEntry => paramEntry[1])
        const otherParamTypes: Type[] = Array.from(other.parameters.entries()).map(paramEntry => paramEntry[1])
        return paramTypes.every((paramType, i) => paramType.equals(otherParamTypes[i]))
    }

    toString(): string {
        const paramsString = Array.from(this.parameters.entries()).reduce((acc, param) => {
            return acc + `${param[0]}: ${param[1]};`
        }, '')
        return `Function(${paramsString}): ${this.returnType}`
    }
}

export class TypeChecker implements Visitor<Type> {
    constructor(public locals: Map<string, Type>,
                public functions: Map<string, FunctionType>,
                public currentFunctionReturnType: Type | null) {
    }

    visitAddNode(node: AddNode): Type {
        assertType(new NumberType(), node.left.visit(this))
        assertType(new NumberType(), node.right.visit(this))
        return new NumberType()
    }

    visitArrayLiteralNode(node: ArrayLiteralNode): Type {
        if (node.args.length === 0) {
            throw TypeError('Cannot infer type of an empty array')
        }
        const argTypes = node.args.map(arg => arg.visit(this))
        const elementsHaveSameType = argTypes.every(argType => argType.equals(argTypes[0]))
        if (!elementsHaveSameType) {
            throw TypeError('Array elements do not have same type')
        }
        return new ArrayType(argTypes[0])
    }

    visitArrayLookupNode(node: ArrayLookupNode): Type {
        assertType(new NumberType(), node.index.visit(this))
        const type = node.array.visit(this)
        if (type instanceof ArrayType && type.element !== null) {
            return type.element
        }
        throw TypeError(`Expected an array, but got ${type}`)
    }

    visitAssignNode(node: AssignNode): Type {
        const variableType = this.locals.get(node.name)
        if (!variableType) {
            throw TypeError(`Assignment to an undefined variable ${node.name}`)
        }
        const valueType = node.value.visit(this)
        assertType(variableType, valueType)
        return new VoidType()
    }

    visitBlockNode(node: BlockNode): Type {
        node.statements.forEach(statement => statement.visit(this))
        return new VoidType()
    }

    visitBooleanNode(node: BooleanNode): Type {
        return new BooleanType()
    }

    visitCallNode(node: CallNode): Type {
        if (node.callee === 'putchar') {
            return new VoidType()
        }
        if (node.callee === 'rand') {
            return new NumberType()
        }

        const expected = this.functions.get(node.callee)
        if (!expected) {
            throw TypeError(`Function ${node.callee} is not defined`)
        }
        let argsTypes = new Map()
        node.args.forEach((arg, i) => argsTypes.set(`x${i}`, arg.visit(this)))
        let got = new FunctionType(argsTypes, expected.returnType)
        assertType(expected, got)
        return expected.returnType
    }

    visitDivideNode(node: DivideNode): Type {
        assertType(new NumberType(), node.left.visit(this))
        assertType(new NumberType(), node.right.visit(this))
        return new NumberType()
    }

    visitEqualNode(node: EqualNode): Type {
        const leftType = node.left.visit(this)
        const rightType = node.right.visit(this)
        assertType(leftType, rightType)
        return new BooleanType()
    }

    visitFunctionNode(node: FunctionNode): Type {
        this.functions.set(node.name, node.signature)
        const visitor = new TypeChecker(
            new Map(node.signature.parameters),
            this.functions,
            node.signature.returnType
        )
        node.body.visit(visitor)
        return new VoidType()
    }

    visitIdentifierNode(node: IdentifierNode): Type {
        const type = this.locals.get(node.value)
        if (!type) {
            throw TypeError(`Undefined variable ${node.value}`)
        }
        return type
    }

    visitIfNode(node: IfNode): Type {
        node.conditional.visit(this)
        node.consequence.visit(this)
        node.alternative.visit(this)
        return new VoidType()
    }

    visitInfixNode(node: InfixNode): Type {
        throw new TypeError('Unreachable')
    }

    visitLengthNode(node: LengthNode): Type {
        return new NumberType()
    }

    visitMultiplyNode(node: MultiplyNode): Type {
        assertType(new NumberType(), node.left.visit(this))
        assertType(new NumberType(), node.right.visit(this))
        return new NumberType()
    }

    visitNotEqualNode(node: NotEqualNode): Type {
        const leftType = node.left.visit(this)
        const rightType = node.right.visit(this)
        assertType(leftType, rightType)
        return new BooleanType()
    }

    visitNotNode(node: NotNode): Type {
        assertType(new BooleanType(), node.term.visit(this))
        return new BooleanType()
    }

    visitNullNode(node: NullNode): Type {
        return new VoidType()
    }

    visitNumberNode(node: NumberNode): Type {
        return new NumberType()
    }

    visitReturnNode(node: ReturnNode): Type {
        let type = node.term.visit(this)
        if (this.currentFunctionReturnType) {
            assertType(this.currentFunctionReturnType, type)
            return new VoidType()
        }
        throw TypeError('Encountered return statement outside any function')
    }

    visitSubtractNode(node: SubtractNode): Type {
        assertType(new NumberType(), node.left.visit(this))
        assertType(new NumberType(), node.right.visit(this))
        return new NumberType()
    }

    visitVarNode(node: VarNode): Type {
        const type = node.value.visit(this)
        this.locals.set(node.name, type)
        return new VoidType()
    }

    visitWhileNode(node: WhileNode): Type {
        node.conditional.visit(this);
        node.body.visit(this);
        return new VoidType()
    }
}
