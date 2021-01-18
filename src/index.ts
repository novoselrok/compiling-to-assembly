import fs from 'fs'
import {parser} from './parser'
import {CodeGenerator, FileEmitter} from './ast'
import {FunctionType, Type, TypeChecker} from './type'

const args = process.argv.slice(2)
const inputFile = args[0]
const outputFile = args[1]

const inputFileText = fs.readFileSync(inputFile).toString()

const node = parser.parseStringToCompletion(inputFileText)
node.visit(new TypeChecker(new Map<string, Type>(), new Map<string, FunctionType>(), null))
node.visit(new CodeGenerator(new Map(), 0, new FileEmitter(outputFile)))
