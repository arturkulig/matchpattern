import { sliceTemplate, TemplateChunkType as T } from './sliceTemplate'

describe('TemplateReader', () => {
    function getTemplateReader(s: TemplateStringsArray, ...args: any[]) {
        return sliceTemplate(s)
    }

    it('slices continous string', () => {
        const chunks = getTemplateReader`{
            abc: 1
        }`
        expect(chunks).toEqual([
            [T.ObjectStart, '{'],
            [T.Space, '\n            '],
            [T.Symbol, 'abc'],
            [T.Symbol, ':'],
            [T.Space, ' '],
            [T.Number, '1'],
            [T.Space, '\n        '],
            [T.ObjectEnd, '}'],
        ])
    })

    it('slices string with expressions', () => {
        const chunks = getTemplateReader`{abc: ${1} ${2}}`
        expect(chunks).toEqual([
            [T.ObjectStart, '{'],
            [T.Symbol, 'abc'],
            [T.Symbol, ':'],
            [T.Space, ' '],
            [T.Ref, 0],
            [T.Space, ' '],
            [T.Ref, 1],
            [T.ObjectEnd, '}'],
        ])
    })

    it('slices string with strings', () => {
        expect(getTemplateReader`{abc: "ba \\".a."}`).toEqual([
            [T.ObjectStart, '{'],
            [T.Symbol, 'abc'],
            [T.Symbol, ':'],
            [T.Space, ' '],
            [T.String, '"ba \\".a."'],
            [T.ObjectEnd, '}'],
        ])
        expect(getTemplateReader`{abc: 'ba \\\\'}`).toEqual([
            [T.ObjectStart, '{'],
            [T.Symbol, 'abc'],
            [T.Symbol, ':'],
            [T.Space, ' '],
            [T.String, '\'ba \\\\\''],
            [T.ObjectEnd, '}'],
        ])
    })

    it('slices string with a number', () => {
        const chunks = getTemplateReader`{abc: 1, ... }`
        expect(chunks).toEqual([
            [T.ObjectStart, '{'],
            [T.Symbol, 'abc'],
            [T.Symbol, ':'],
            [T.Space, ' '],
            [T.Number, '1'],
            [T.Symbol, ','],
            [T.Space, ' '],
            [T.Fold, '...'],
            [T.Space, ' '],
            [T.ObjectEnd, '}'],
        ])
    })

    it('slices string with a negative number', () => {
        const chunks = getTemplateReader`{abc: -1, ...auto}`
        expect(chunks).toEqual([
            [T.ObjectStart, '{'],
            [T.Symbol, 'abc'],
            [T.Symbol, ':'],
            [T.Space, ' '],
            [T.Number, '-1'],
            [T.Symbol, ','],
            [T.Space, ' '],
            [T.Fold, '...auto'],
            [T.ObjectEnd, '}'],
        ])
    })

    it('slices with a class instance as string', () => {
        expect(getTemplateReader`{ instance: %Klass{ a: 1 } }`)
            .toEqual([
                [T.ObjectStart, '{'],
                [T.Space, ' '],
                [T.Symbol, 'instance'],
                [T.Symbol, ':'],
                [T.Space, ' '],
                [T.ClassStart, '%'],
                [T.Symbol, 'Klass'],
                [T.ObjectStart, '{'],
                [T.Space, ' '],
                [T.Symbol, 'a'],
                [T.Symbol, ':'],
                [T.Space, ' '],
                [T.Number, '1'],
                [T.Space, ' '],
                [T.ObjectEnd, '}'],
                [T.Space, ' '],
                [T.ObjectEnd, '}'],
            ])
    })

    it('slices with a class instance as reference', () => {
        class SomeClass { }
        expect(getTemplateReader`{ instance: %${SomeClass}{ a: 1 } }`)
            .toEqual([
                [T.ObjectStart, '{'],
                [T.Space, ' '],
                [T.Symbol, 'instance'],
                [T.Symbol, ':'],
                [T.Space, ' '],
                [T.ClassStart, '%'],
                [T.Ref, 0],
                [T.ObjectStart, '{'],
                [T.Space, ' '],
                [T.Symbol, 'a'],
                [T.Symbol, ':'],
                [T.Space, ' '],
                [T.Number, '1'],
                [T.Space, ' '],
                [T.ObjectEnd, '}'],
                [T.Space, ' '],
                [T.ObjectEnd, '}'],
            ])
    })
})