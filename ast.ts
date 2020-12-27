export class Environment {
    // @ts-ignore
    constructor(public locals: Map<string, number>, public nextLocalOffset: number) {}
}

export interface AST {
    emit(Environment): void
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

    emit(env: Environment): void {
        this.left.emit(env)
        emit(`  push {r0, ip}`)
        this.right.emit(env)
        emit(`  pop {r1, ip}`)
    }

    abstract equals(other: AST): boolean
}

export class NumberNode implements AST {
    constructor(public value: number) {}

    emit(env: Environment): void {
        emit(`  ldr r0, =${this.value}`)
    }

    equals(other: AST): boolean {
        return other instanceof NumberNode && this.value === other.value
    }
}

export class BooleanNode implements AST {
    constructor(public value: boolean) {}

    emit(env: Environment) {
        const assemblyValue = this.value ? 1 : 0
        emit(`  mov r0, #${assemblyValue}`)
    }

    equals(other: AST): boolean {
        return other instanceof BooleanNode && this.value === other.value;
    }
}

export class NullNode implements AST {
    emit(env: Environment) {
        emit(`  mov r0, #0`)
    }

    equals(other: AST): boolean {
        return other instanceof NullNode;
    }
}

export class IdentifierNode implements AST {
    constructor(public value: string) {}

    emit(env: Environment): void {
        const offset = env.locals.get(this.value)
        if (!offset) {
            throw Error(`Undefined variable: ${this.value}`)
        }
        emit(`  ldr r0, [fp, #${offset}]`)
    }

    equals(other: AST): boolean {
        return other instanceof IdentifierNode && this.value === other.value
    }
}

export class NotNode implements AST {
    constructor(public term: AST) {}

    emit(env: Environment): void {
        this.term.emit(env)
        emit('  cmp r0, #0')
        emit('  moveq r0, #1')
        emit('  movne r0, #0')
    }

    equals(other: AST): boolean {
        return other instanceof NotNode && this.term.equals(other.term)
    }
}

export class EqualNode extends InfixNode {
    emit(env: Environment): void {
        super.emit(env)
        emit(`  cmp r0, r1`)
        emit(`  moveq r0, #1`)
        emit(`  movne r0, #0`)
    }

    equals(other: AST): boolean {
        return other instanceof EqualNode && this.left.equals(other.left) && this.right.equals(other.right)
    }
}

export class NotEqualNode extends InfixNode {
    emit(env: Environment): void {
        super.emit(env)
        emit(`  cmp r0, r1`)
        emit(`  moveq r0, #0`)
        emit(`  movne r0, #1`)
    }

    equals(other: AST): boolean {
        return other instanceof NotEqualNode && this.left.equals(other.left) && this.right.equals(other.right)
    }
}

export class AddNode extends InfixNode {
    emit(env: Environment): void {
        super.emit(env)
        emit(`  add r0, r0, r1`)
    }

    equals(other: AST): boolean {
        return other instanceof AddNode && this.left.equals(other.left) && this.right.equals(other.right)
    }
}

export class SubtractNode extends InfixNode {
    emit(env: Environment): void {
        super.emit(env)
        emit(`  sub r0, r1, r0`)
    }

    equals(other: AST): boolean {
        return other instanceof SubtractNode && this.left.equals(other.left) && this.right.equals(other.right)
    }
}

export class MultiplyNode extends InfixNode {
    emit(env: Environment): void {
        super.emit(env)
        emit(`  mul r0, r0, r1`)
    }

    equals(other: AST): boolean {
        return other instanceof MultiplyNode && this.left.equals(other.left) && this.right.equals(other.right)
    }
}

export class DivideNode extends InfixNode {
    emit(env: Environment): void {
        super.emit(env)
        emit(`  udiv r0, r1, r0`)
    }

    equals(other: AST): boolean {
        return other instanceof DivideNode && this.left.equals(other.left) && this.right.equals(other.right)
    }
}

export class CallNode implements AST {
    constructor(public callee: string, public args: Array<AST>) {}

    emit(env: Environment): void {
        const numArgs = this.args.length
        if (numArgs > 4) {
            throw Error('Calls with more than 4 arguments are not supported.')
        }

        if (numArgs === 1) {
            this.args[0].emit(env)
        } else if (numArgs >= 2) {
            emit(`  sub sp, sp, #16`)
            this.args.forEach((arg, i) => {
                arg.emit(env)
                emit(`  str r0, [sp, #${i * 4}]`)
            })
            emit(`  pop {r0, r1, r2, r3}`)
        }
        emit(`  bl ${this.callee}`)
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

    emit(env: Environment): void {
        this.term.emit(env)

        emit(`  mov sp, fp`)
        emit(`  pop {fp, pc}`)
    }

    equals(other: AST): boolean {
        return other instanceof ReturnNode && this.term.equals(other.term)
    }
}

export class BlockNode implements AST {
    constructor(public statements: Array<AST>) {}

    emit(env: Environment): void {
        this.statements.forEach(statement => statement.emit(env))
    }

    equals(other: AST): boolean {
        return other instanceof BlockNode &&
            this.statements.length === other.statements.length &&
            this.statements.every((statement, i) => statement.equals(other.statements[i]))
    }
}

export class IfNode implements AST {
    constructor(public conditional: AST, public consequence: AST, public alternative: AST) {}

    emit(env: Environment): void {
        const ifFalseLabel = new Label()
        const endIfLabel = new Label()
        this.conditional.emit(env)
        emit(`  cmp r0, #0`)
        emit(`  beq ${ifFalseLabel}`)
        this.consequence.emit(env)
        emit(`  b ${endIfLabel}`)
        emit(`${ifFalseLabel}:`)
        this.alternative.emit(env)
        emit(`${endIfLabel}:`)
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

    emit(_: Environment): void {
        if (this.parameters.length > 4) {
            throw Error('Functions with more than 4 params are not supported.')
        }

        emit('')
        emit(`.global ${this.name}`)
        emit(`${this.name}:`)
        this.emitPrologue()
        this.body.emit(this.setUpEnvironment())
        this.emitEpilogue()
    }

    emitPrologue(): void {
        emit(`  push {fp, lr}`);
        emit(`  mov fp, sp`);
        emit(`  push {r0, r1, r2, r3}`);
    }

    emitEpilogue(): void {
        emit(`  mov sp, fp`);
        emit(`  mov r0, #0`);
        emit(`  pop {fp, pc}`);
    }

    setUpEnvironment(): Environment {
        // @ts-ignore
        const locals = new Map()
        this.parameters.forEach((parameter, i) => locals.set(parameter, 4 * i - 16))
        return new Environment(locals, -20)
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

    emit(env: Environment): void {
        this.value.emit(env)
        emit(`  push {r0, ip}`)
        env.locals.set(this.name, env.nextLocalOffset - 4)
        env.nextLocalOffset -= 8
    }

    equals(other: AST): boolean {
        return other instanceof VarNode &&
            this.name === other.name &&
            this.value.equals(other.value)
    }
}

export class AssignNode implements AST {
    constructor(public name: string, public value: AST) {}

    emit(env: Environment): void {
        this.value.emit(env)
        const offset = env.locals.get(this.name)
        if (!offset) {
            throw Error(`Undefined variable: ${this.name}`)
        }
        emit(`  str r0, [fp, #${offset}]`);
    }

    equals(other: AST): boolean {
        return other instanceof AssignNode &&
            this.name === other.name &&
            this.value.equals(other.value)
    }
}

export class WhileNode implements AST {
    constructor(public conditional: AST, public body: AST) {}

    emit(env: Environment): void {
        const loopStart = new Label()
        const loopEnd = new Label()

        emit(`${loopStart}:`)
        this.conditional.emit(env)
        emit(`  cmp r0, #0`)
        emit(`  beq ${loopEnd}`)
        this.body.emit(env)
        emit(`  b ${loopStart}`)
        emit(`${loopEnd}:`)
    }

    equals(other: AST): boolean {
        return other instanceof WhileNode &&
            this.conditional.equals(other.conditional) &&
            this.body.equals(other.body)
    }
}

export class ArrayLiteralNode implements AST {
    constructor(public args: Array<AST>) {}

    emit(env: Environment): void {
        const length = this.args.length
        emit(`  ldr r0, =${4 * (length + 1)}`)
        emit(`  bl malloc`)
        emit(`  push {r4, ip}`)
        emit(`  mov r4, r0`)
        emit(`  ldr r0, =${length}`)
        emit(`  str r0, [r4]`)
        this.args.forEach((element, i) => {
            element.emit(env)
            emit(`  str r0, [r4, #${4 * (i + 1)}]`)
        })
        emit(`  mov r0, r4`)
        emit(`  pop {r4, ip}`)
    }

    equals(AST): boolean {
        return false;
    }
}

export class ArrayLookupNode implements AST {
    constructor(public array: AST, public index: AST) {}

    emit(env: Environment): void {
        this.array.emit(env)
        emit(` push {r0, ip}`)
        this.index.emit(env)
        emit(` pop {r1, ip}`)
        emit(` ldr r2, [r1]`)
        emit(` cmp r0, r2`)
        emit(` movhs r0, #0`)
        emit(` addlo r1, r1, #4`)
        emit(` lsllo r0, r0, #2`)
        emit(` ldrlo r0, [r1, r0]`)
    }

    equals(AST): boolean {
        return false;
    }
}

export class LengthNode implements AST {
    constructor(public array: AST) {}

    emit(env: Environment): void {
        this.array.emit(env)
        emit(` ldr r0, [r0, #0]`)
    }

    equals(AST): boolean {
        return false;
    }
}
