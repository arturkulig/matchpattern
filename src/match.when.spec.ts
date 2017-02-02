import { match, when, is, isNot } from './match.when'

describe('match when', () => {
    it('throws when no maching case', () => {
        expect(() => {
            match(3, [
                when`2`(() => 2),
                when`1`(() => 1),
            ])
        }).toThrow()
    })
    it('return with function', () => {
        expect(match(1, [
            when`{a: 1}`(() => 'wow!'),
            when`2`(() => 2),
            when`1`(() => 1),
            when`_`(() => null)
        ])).toBe(1)
    })
    it('return with just value', () => {
        expect(match(1, [
            when`{a: 1}`('wow!'),
            when`2`(2),
            when`1`(1),
            when`_`(null)
        ])).toBe(1)
    })
    it('matches refs', () => {
        const ref = {}
        expect(match(ref, [
            when`{a: 1}`('wow!'),
            when`${ref}`(2),
            when`1`(1),
            when`_`(null)
        ])).toBe(2)
    })
    it('matches refs, but similarity wins', () => {
        const ref = { a: 1 }
        expect(match(ref, [
            when`{a: 1}`('wow!'),
            when`${ref}`(2),
            when`1`(1),
            when`_`(null)
        ])).toBe('wow!')
    })
    it('passes output', () => {
        expect(match({ a: { b: { c: 42 } } }, [
            when`{ a: { b: { c: 23 } } }`(() => { throw new Error() }),
            when`{ a: { b: { c: everything } } }`(({everything}) => everything),
            when`_`(() => { throw new Error() }),
        ])).toBe(42)
    })
    it('is curried', () => {
        expect(
            [1, 'foo', 3].map(match([
                when`'foo'`('bar'),
                when`n`(({n}) => n * 2)
            ]))
        ).toEqual(
            [2, 'bar', 6]
            )
    })
})

describe('simple checks', () => {
    it('is', () => {
        expect([1, 2, 3].filter(is`2`)).toEqual([2])
    })
    it('isNot', () => {
        expect([1, 2, 3].filter(isNot`2`)).toEqual([1, 3])
    })
})