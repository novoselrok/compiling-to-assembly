import {Parser, Source} from './parser'

const source = new Source('hello1 bye2', 0)
const result = Parser.regexp(/hello[0-9]/y).parse(source)

console.assert(result.value === 'hello1')
console.assert(result.source.index === 6)
