import { sliceTemplate, TemplateChunkType } from './sliceTemplate'
const {Text, Ref} = TemplateChunkType

describe('TemplateReader', () => {
    function getTemplateReader(s: TemplateStringsArray, ...args: any[]) {
        return sliceTemplate(s)
    }

    it('slices continous string', () => {
        const chunks = getTemplateReader`{abc: 1 }`
        expect(chunks).toEqual([
            [Text, '{'],
            [Text, 'abc'],
            [Text, ':'],
            [Text, ' 1 '],
            [Text, '}'],
        ])
    })

    it('slices string with expressions', () => {
        const chunks = getTemplateReader`{abc: ${1} ${2}}`
        expect(chunks).toEqual([
            [Text, '{'],
            [Text, 'abc'],
            [Text, ':'],
            [Text, ' '],
            [Ref, 0],
            [Text, ' '],
            [Ref, 1],
            [Text, '}'],
        ])
    })

    it('slices string with strings', () => {
        const chunks = getTemplateReader`{abc: "ba \\".a."}`
        expect(chunks).toEqual([
            [Text, '{'],
            [Text, 'abc'],
            [Text, ':'],
            [Text, ' '],
            [Text, '"'],
            [Text, 'ba '],
            [Text, '\\'],
            [Text, '"'],
            [Text, '.'],
            [Text, 'a'],
            [Text, '.'],
            [Text, '"'],
            [Text, '}'],
        ])
    })

    it('slices string with number', () => {
        const chunks = getTemplateReader`{abc: 1 }`
        expect(chunks).toEqual([
            [Text, '{'],
            [Text, 'abc'],
            [Text, ':'],
            [Text, ' 1 '],
            [Text, '}'],
        ])
    })
})