import {parser} from './parser'
import {Environment} from './ast'

const node = parser.parseStringToCompletion(`
    function assert(x) {
        if (x) {
            putchar(46);
        } else {
            putchar(70);
        }
    }
    function assert1234(a, b, c, d) {
        assert(a == 1);
        assert(b == 2);
        assert(c == 3);
        assert(d == 4);
    }
    function factorial(n) {
        if (n == 0) {
            return 1;
        } else {
            return n * factorial(n - 1);
        }
    }
    function factorialLoop(n) {
        var result = 1;
        while (n != 1) {
            result = result * n;
            n = n - 1;
        }
        return result;
    }
    function main() {
        assert(1);
        assert(!0);
        assert(42 == 4 + 2 * (12 - 2) + 3 * (5 + 1));
        assert(7 == 10 - 1 - 1 - 1);
        assert(2 == 10 / 5);
        assert(3 == 9 / 3);
        {
        /* Block statement */
            assert(1);
            assert(1);
        }
        putchar(46); // 46 is ASCII dot
        assert(rand() != 42);
        
        if (1) {
            assert(1);
        } else {
            assert(0);
        }
        if (0) {
            assert(0);
        } else {
            assert(1);
        }
        assert1234(1, 2, 3, 4);
        assert(720 == factorial(6));
        var x = 4 + 2 * (12 - 2);
        var y = 3 * (5 + 1);
        var z = x + y;
        assert(z == 42);
        var a = 1;
        assert(a == 1);
        a = 0;
        assert(a == 0);
        assert(factorial(6) == factorialLoop(6));
        assert(factorial(6) != factorialLoop(10));
        assert(true);
        assert(!false);
        assert(null == null);
        
        var arr = [1, 2, 3];
        assert(arr[0] == 1);
        assert(arr[1] == 2);
        assert(arr[2] == 3);
        assert(length(arr) == 3);
    }
`)

// @ts-ignore
node.emit(new Environment(new Map<string, number>(), 0))
