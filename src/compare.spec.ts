import { compare } from './compare'

function match(s: TemplateStringsArray, ...args: any[]) {
    return (value) => compare(value, s, args)
}

describe('match', () => {
    it('can match strings', () => {
        expect(match`'abc'`('abc')).not.toBe(null)
        expect(match`"abc"`('abc')).not.toBe(null)
        expect(match`"a'bc"`('a\'bc')).not.toBe(null)
        expect(match`"a'bc"`(0)).toBe(null)
        expect(match`"a'bc"`({ a: 1 })).toBe(null)
    })

    describe('can match objects', () => {
        it('with strings', () => {
            expect(match`{a: 'a'}`({ a: 'a' })).not.toBe(null)
            expect(match`{a: 'a', b: 'aa'}`({ a: 'a', b: 'aa' })).not.toBe(null)
            expect(match`{a: 'a'}`({ a: 'b' })).toBe(null)
            expect(match`{a: 'a'}`({ b: 'a' })).toBe(null)
            expect(match`{a: 'a'}`({ a: 'a', b: 'a' })).toBe(null)
            expect(match`{a: 'a', b: 'a'}`({ a: 'a' })).toBe(null)
        })
        it('with numbers', () => {
            expect(match`{a: 42}`({ a: 42 })).not.toBe(null)
        })
        it('with arrays', () => {
            expect(match`{a: ['b']}`({ a: ['b'] })).not.toBe(null)
            expect(match`{a: ['c']}`({ a: ['b'] })).toBe(null)
        })
        it('nested', () => {
            expect(match`{a: {b : 'c'}}`({ a: { b: 'c' } })).not.toBe(null)
            expect(match`{a: {b : 'c'}}`({ a: 'a' })).toBe(null)
        })
        it('spread', () => {
            expect(match`{a : 1, b: 2, ...}`({ a: 1, b: 2, c: 3 })).not.toBe(null)
            expect(match`{a : 1, b: 2, ...others}`({ a: 1, b: 2, c: 3 })).toEqual({ others: { c: 3 } })
            expect(match`{a : 1, b: 2, ...}`({ a: 1 })).toBe(null)
            expect(match`{a : 1, b: 2, ...}`({ b: 2 })).toBe(null)
        })
    })

    describe('can match arrays', () => {
        it('with strings', () => {
            expect(match`['a']`(['a'])).not.toBe(null)
            expect(match`['a', 'asdasd']`(['a', 'asdasd'])).not.toBe(null)
            expect(match`['a' , 'asdasd']`(['a', 'asdasd'])).not.toBe(null)
            expect(match`[ 'a' , 'asdasd']`(['a', 'asdasd'])).not.toBe(null)
        })
        it('with objects', () => {
            expect(match`[{a: 'a'}]`([{ a: 'a' }])).not.toBe(null)
            expect(match`[{a: 'a'}, 'zxc']`([{ a: 'a' }, 'zxc'])).not.toBe(null)
            expect(match`[{a: 'a'}]`([{ b: 'a' }])).toBe(null)
        })
        it('spread', () => {
            expect(match`[1,2,3,...]`([1, 2, 3, 4, 5])).not.toBe(null)
            expect(match`[1,2,3,...]`([1, 2])).toBe(null)
            expect(match`[1,2,3,...others]`([1, 2, 3, 4, 5])).toEqual({ others: [4, 5] })
        })
    })

    describe('can match any', () => {
        it('as immediate token', () => {
            expect(match`_`(1)).not.toBe(null)
            expect(match`_`(null)).not.toBe(null)
        })
        it('inside an object', () => {
            expect(match`{a: _, b: 2}`({ a: 1, b: 2 })).not.toBe(null)
            expect(match`{a: 1, b: _}`({ a: 1, b: 2 })).not.toBe(null)
            expect(match`{a: 1, b: _}`({ a: 1, c: 2 })).toBe(null)
        })
    })

    describe('can match reference', () => {
        it('as immediate token', () => {
            const ref = {}
            expect(match`${ref}`(ref)).not.toBe(null)
            expect(match`${ref}`({})).toBe(null)
        })
        it('inside object', () => {
            const ref = {}
            expect(match`{ref: ${ref}}`({ ref })).not.toBe(null)
            expect(match`{ref: ${ref}}`({ ref: {} })).toBe(null)
        })
        it('inside array', () => {
            const ref = {}
            expect(match`['a', {ref: ${ref}}]`(['a', { ref }])).not.toBe(null)
            expect(match`['a', {ref: ${ref}}]`(['a', { ref: {} }])).toBe(null)
        })
    })

    describe('can provide output', () => {
        it('immediately', () => {
            expect(match`xy`(1)).toEqual({ xy: 1 })
        })
        it('in object', () => {
            expect(match`{a: {b: {c: devil}}}`({ a: { b: { c: 666 } } })).toEqual({ devil: 666 })
        })
    })
})