import { match, when } from './match.when'

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
})
