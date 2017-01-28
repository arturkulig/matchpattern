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
        expect(getTemplateReader`{abc: 'ba \\'.a.'}`).toEqual([
            [T.ObjectStart, '{'],
            [T.Symbol, 'abc'],
            [T.Symbol, ':'],
            [T.Space, ' '],
            [T.String, '\'ba \\\'.a.\''],
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
})