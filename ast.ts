interface Visitor<T> {
    visitInfixNode(node: InfixNode): T
    visitNumberNode(node: NumberNode): T
    visitBooleanNode(node: BooleanNode): T
    visitNullNode(node: NullNode): T
    visitIdentifierNode(node: IdentifierNode): T
    visitNotNode(node: NotNode): T
    visitEqualNode(node: EqualNode): T
    visitNotEqualNode(node: NotEqualNode): T
    visitAddNode(node: AddNode): T
    visitSubtractNode(node: SubtractNode): T
    visitMultiplyNode(node: MultiplyNode): T
    visitDivideNode(node: DivideNode): T
    visitCallNode(node: CallNode): T
    visitReturnNode(node: ReturnNode): T
    visitBlockNode(node: BlockNode): T
    visitIfNode(node: IfNode): T
    visitFunctionNode(node: FunctionNode): T
    visitVarNode(node: VarNode): T
    visitAssignNode(node: AssignNode): T
    visitWhileNode(node: WhileNode): T
    visitArrayLiteralNode(node: ArrayLiteralNode): T
    visitArrayLookupNode(node: ArrayLookupNode): T
    visitLengthNode(node: LengthNode): T
}

export interface AST {
    visit<T>(v: Visitor<T>): T;
    equals(AST): boolean
}

const emit = console.log

class Label {
    static counter = 0
    value: number

    constructor() {
        this.value = Label.counter++
    }

    toString() {
        return `.L${this.value}`
    }
}

abstract class InfixNode implements AST {
    protected constructor(public left: AST, public right: AST) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitInfixNode(this)
    }

    abstract equals(other: AST): boolean

}

export class NumberNode implements AST {
    constructor(public value: number) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitNumberNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof NumberNode && this.value === other.value
    }
}

export class BooleanNode implements AST {
    constructor(public value: boolean) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitBooleanNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof BooleanNode && this.value === other.value;
    }
}

export class NullNode implements AST {
    visit<T>(v: Visitor<T>): T {
        return v.visitNullNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof NullNode;
    }
}

export class IdentifierNode implements AST {
    constructor(public value: string) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitIdentifierNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof IdentifierNode && this.value === other.value
    }
}

export class NotNode implements AST {
    constructor(public term: AST) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitNotNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof NotNode && this.term.equals(other.term)
    }
}

export class EqualNode extends InfixNode {
    visit<T>(v: Visitor<T>): T {
        return v.visitEqualNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof EqualNode && this.left.equals(other.left) && this.right.equals(other.right)
    }
}

export class NotEqualNode extends InfixNode {
    visit<T>(v: Visitor<T>): T {
        return v.visitNotEqualNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof NotEqualNode && this.left.equals(other.left) && this.right.equals(other.right)
    }
}

export class AddNode extends InfixNode {
    visit<T>(v: Visitor<T>): T {
        return v.visitAddNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof AddNode && this.left.equals(other.left) && this.right.equals(other.right)
    }
}

export class SubtractNode extends InfixNode {
    visit<T>(v: Visitor<T>): T {
        return v.visitSubtractNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof SubtractNode && this.left.equals(other.left) && this.right.equals(other.right)
    }
}

export class MultiplyNode extends InfixNode {
    visit<T>(v: Visitor<T>): T {
        return v.visitMultiplyNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof MultiplyNode && this.left.equals(other.left) && this.right.equals(other.right)
    }
}

export class DivideNode extends InfixNode {
    visit<T>(v: Visitor<T>): T {
        return v.visitDivideNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof DivideNode && this.left.equals(other.left) && this.right.equals(other.right)
    }
}

export class CallNode implements AST {
    constructor(public callee: string, public args: Array<AST>) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitCallNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof CallNode &&
            this.callee === other.callee &&
            this.args.length === other.args.length &&
            this.args.every((arg, i) => arg.equals(other.args[i]))
    }
}

export class ReturnNode implements AST {
    constructor(public term: AST) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitReturnNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof ReturnNode && this.term.equals(other.term)
    }
}

export class BlockNode implements AST {
    constructor(public statements: Array<AST>) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitBlockNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof BlockNode &&
            this.statements.length === other.statements.length &&
            this.statements.every((statement, i) => statement.equals(other.statements[i]))
    }
}

export class IfNode implements AST {
    constructor(public conditional: AST, public consequence: AST, public alternative: AST) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitIfNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof IfNode &&
            this.conditional.equals(other.conditional) &&
            this.consequence.equals(other.consequence) &&
            this.alternative.equals(other.alternative)
    }
}

export class FunctionNode implements AST {
    constructor(public name: string, public parameters: Array<string>, public body: AST) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitFunctionNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof FunctionNode &&
            this.name === other.name &&
            this.body.equals(other.body) &&
            this.parameters.length === other.parameters.length &&
            this.parameters.every((parameter, i) => parameter === other.parameters[i])
    }
}

export class VarNode implements AST {
    constructor(public name: string, public value: AST) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitVarNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof VarNode &&
            this.name === other.name &&
            this.value.equals(other.value)
    }
}

export class AssignNode implements AST {
    constructor(public name: string, public value: AST) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitAssignNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof AssignNode &&
            this.name === other.name &&
            this.value.equals(other.value)
    }
}

export class WhileNode implements AST {
    constructor(public conditional: AST, public body: AST) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitWhileNode(this)
    }

    equals(other: AST): boolean {
        return other instanceof WhileNode &&
            this.conditional.equals(other.conditional) &&
            this.body.equals(other.body)
    }
}

export class ArrayLiteralNode implements AST {
    constructor(public args: Array<AST>) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitArrayLiteralNode(this)
    }

    equals(AST): boolean {
        return false;
    }
}

export class ArrayLookupNode implements AST {
    constructor(public array: AST, public index: AST) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitArrayLookupNode(this)
    }

    equals(AST): boolean {
        return false;
    }
}

export class LengthNode implements AST {
    constructor(public array: AST) {}

    visit<T>(v: Visitor<T>): T {
        return v.visitLengthNode(this)
    }

    equals(AST): boolean {
        return false;
    }
}

export class CodeGenerator implements Visitor<void> {
    constructor(public locals: Map<string, number> = new Map(), public nextLocalOffset: number = 0) {}

    visitAddNode(node: AddNode): void {
        this.visitInfixNode(node)
        emit(`  add r0, r0, r1`)
    }

    visitArrayLiteralNode(node: ArrayLiteralNode): void {
        const length = node.args.length
        emit(`  ldr r0, =${4 * (length + 1)}`)
        emit(`  bl malloc`)
        emit(`  push {r4, ip}`)
        emit(`  mov r4, r0`)
        emit(`  ldr r0, =${length}`)
        emit(`  str r0, [r4]`)
        node.args.forEach((element, i) => {
            element.visit(this)
            emit(`  str r0, [r4, #${4 * (i + 1)}]`)
        })
        emit(`  mov r0, r4`)
        emit(`  pop {r4, ip}`)
    }

    visitArrayLookupNode(node: ArrayLookupNode): void {
        node.array.visit(this)
        emit(` push {r0, ip}`)
        node.index.visit(this)
        emit(` pop {r1, ip}`)
        emit(` ldr r2, [r1]`)
        emit(` cmp r0, r2`)
        emit(` movhs r0, #0`)
        emit(` addlo r1, r1, #4`)
        emit(` lsllo r0, r0, #2`)
        emit(` ldrlo r0, [r1, r0]`)
    }

    visitAssignNode(node: AssignNode): void {
        node.value.visit(this)
        const offset = this.locals.get(node.name)
        if (!offset) {
            throw Error(`Undefined variable: ${node.name}`)
        }
        emit(`  str r0, [fp, #${offset}]`)
    }

    visitBlockNode(node: BlockNode): void {
        node.statements.forEach(statement => statement.visit(this))
    }

    visitBooleanNode(node: BooleanNode): void {
        const assemblyValue = node.value ? 1 : 0
        emit(`  mov r0, #${assemblyValue}`)
    }

    visitCallNode(node: CallNode): void {
        const numArgs = node.args.length
        if (numArgs > 4) {
            throw Error('Calls with more than 4 arguments are not supported.')
        }

        if (numArgs === 1) {
            node.args[0].visit(this)
        } else if (numArgs >= 2) {
            emit(`  sub sp, sp, #16`)
            node.args.forEach((arg, i) => {
                arg.visit(this)
                emit(`  str r0, [sp, #${i * 4}]`)
            })
            emit(`  pop {r0, r1, r2, r3}`)
        }
        emit(`  bl ${node.callee}`)
    }

    visitDivideNode(node: DivideNode): void {
        this.visitInfixNode(node)
        emit(`  udiv r0, r1, r0`)
    }

    visitEqualNode(node: EqualNode): void {
        this.visitInfixNode(node)
        emit(`  cmp r0, r1`)
        emit(`  moveq r0, #1`)
        emit(`  movne r0, #0`)
    }

    private static emitFunctionPrologue(): void {
        emit(`  push {fp, lr}`);
        emit(`  mov fp, sp`);
        emit(`  push {r0, r1, r2, r3}`);
    }

    private static emitFunctionEpilogue(): void {
        emit(`  mov sp, fp`);
        emit(`  mov r0, #0`);
        emit(`  pop {fp, pc}`);
    }

    private setUpFunctionVisitor(node: FunctionNode): CodeGenerator {
        const locals = new Map()
        node.parameters.forEach((parameter, i) => locals.set(parameter, 4 * i - 16))
        return new CodeGenerator(locals, -20)
    }

    visitFunctionNode(node: FunctionNode): void {
        if (node.parameters.length > 4) {
            throw Error('Functions with more than 4 params are not supported.')
        }

        emit('')
        emit(`.global ${node.name}`)
        emit(`${node.name}:`)
        CodeGenerator.emitFunctionPrologue()
        node.body.visit(this.setUpFunctionVisitor(node))
        CodeGenerator.emitFunctionEpilogue()
    }

    visitIdentifierNode(node: IdentifierNode): void {
        const offset = this.locals.get(node.value)
        if (!offset) {
            throw Error(`Undefined variable: ${node.value}`)
        }
        emit(`  ldr r0, [fp, #${offset}]`)
    }

    visitIfNode(node: IfNode): void {
        const ifFalseLabel = new Label()
        const endIfLabel = new Label()
        node.conditional.visit(this)
        emit(`  cmp r0, #0`)
        emit(`  beq ${ifFalseLabel}`)
        node.consequence.visit(this)
        emit(`  b ${endIfLabel}`)
        emit(`${ifFalseLabel}:`)
        node.alternative.visit(this)
        emit(`${endIfLabel}:`)
    }

    visitInfixNode(node: InfixNode): void {
        node.left.visit(this)
        emit(`  push {r0, ip}`)
        node.right.visit(this)
        emit(`  pop {r1, ip}`)
    }

    visitLengthNode(node: LengthNode): void {
        node.array.visit(this)
        emit(` ldr r0, [r0, #0]`)
    }

    visitMultiplyNode(node: MultiplyNode): void {
        this.visitInfixNode(node)
        emit(`  mul r0, r0, r1`)
    }

    visitNotEqualNode(node: NotEqualNode): void {
        this.visitInfixNode(node)
        emit(`  cmp r0, r1`)
        emit(`  moveq r0, #0`)
        emit(`  movne r0, #1`)
    }

    visitNotNode(node: NotNode): void {
        node.term.visit(this)
        emit('  cmp r0, #0')
        emit('  moveq r0, #1')
        emit('  movne r0, #0')
    }

    visitNullNode(node: NullNode): void {
        emit(`  mov r0, #0`)
    }

    visitNumberNode(node: NumberNode): void {
        emit(`  ldr r0, =${node.value}`)
    }

    visitReturnNode(node: ReturnNode): void {
        node.term.visit(this)

        emit(`  mov sp, fp`)
        emit(`  pop {fp, pc}`)
    }

    visitSubtractNode(node: SubtractNode): void {
        this.visitInfixNode(node)
        emit(`  sub r0, r1, r0`)
    }

    visitVarNode(node: VarNode): void {
        node.value.visit(this)
        emit(`  push {r0, ip}`)
        this.locals.set(node.name, this.nextLocalOffset - 4)
        this.nextLocalOffset -= 8
    }

    visitWhileNode(node: WhileNode): void {
        const loopStart = new Label()
        const loopEnd = new Label()

        emit(`${loopStart}:`)
        node.conditional.visit(this)
        emit(`  cmp r0, #0`)
        emit(`  beq ${loopEnd}`)
        node.body.visit(this)
        emit(`  b ${loopStart}`)
        emit(`${loopEnd}:`)
    }
}
