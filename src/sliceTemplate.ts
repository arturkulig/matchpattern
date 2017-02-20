export enum TemplateChunkType {
    Symbol,
    Space,
    String,
    Number,
    ObjectStart,
    ObjectEnd,
    ArrayStart,
    ArrayEnd,
    Fold,
    Blank,
    Ref,
}
export type TemplateTextChunk = [
    TemplateChunkType.Space |
    TemplateChunkType.ObjectStart |
    TemplateChunkType.ObjectEnd |
    TemplateChunkType.ArrayStart |
    TemplateChunkType.ArrayEnd |
    TemplateChunkType.Blank |
    TemplateChunkType.String |
    TemplateChunkType.String |
    TemplateChunkType.Number |
    TemplateChunkType.Fold |
    TemplateChunkType.Symbol,
    string
]
export type TemplateRefChunk = [TemplateChunkType.Ref, number]
export type TemplateChunk =
    TemplateRefChunk |
    TemplateTextChunk
type FuncTokenMatcher = (tmpl: string) => string[]

function matchSpaceToken(template: string) {
    let i = 0
    for (; i < template.length; i++) {
        if (
            template[i] !== ' ' &&
            template[i] !== '\n' &&
            template[i] !== '\r'
        ) {
            break
        }
    }
    if (i === 0) {
        return null
    }
    return [template, template.substring(0, i), template.substring(i)]
}

function matchStringToken(template: string) {
    if (template[0] === '"' || template[0] === '\'') {
        const quote = template[0]
        for (let i = 1; ; i++) {
            if (template[i] === '\\') {
                i++
                continue
            }
            if (template[i] === quote) {
                return [template, template.substring(0, i + 1), template.substring(i + 1)]
            }
        }
    }
    return null
}

function matchSomeSpecificChar(char: string) {
    return (template: string) => {
        if (template[0] === char) {
            return [template, template[0], template.substring(1)]
        }
        return null
    }
}

const tokenMatchers: [TemplateChunkType, RegExp | FuncTokenMatcher][] = [
    [TemplateChunkType.Space, matchSpaceToken],
    [TemplateChunkType.ObjectStart, matchSomeSpecificChar('{')],
    [TemplateChunkType.ObjectEnd, matchSomeSpecificChar('}')],
    [TemplateChunkType.ArrayStart, matchSomeSpecificChar('[')],
    [TemplateChunkType.ArrayEnd, matchSomeSpecificChar(']')],
    [TemplateChunkType.Blank, matchSomeSpecificChar('_')],
    [TemplateChunkType.String, matchStringToken],
    [TemplateChunkType.Number, /^(-?[0-9]+(?:\.[0-9]+)?)((?:.|\r|\n)*)$/],
    [TemplateChunkType.Fold, /^(\.\.\.[a-zA-Z0-9]*)((?:.|\r|\n)*)$/],
    [TemplateChunkType.Symbol, /^([a-zA-Z0-9]+|[^ ])((?:.|\r|\n)*)$/],
]

export function sliceTemplate(templates: TemplateStringsArray) {
    const chunks = []
    for (let i = 0; i < templates.length; i++) {
        if (i > 0) {
            chunks.push([TemplateChunkType.Ref, i - 1])
        }
        let template = templates[i]

        templateLoop:
        while (template.length > 0) {
            for (let tMIdx = 0; tMIdx < tokenMatchers.length; tMIdx++) {
                const matcher = tokenMatchers[tMIdx][1]
                let match
                if (typeof matcher === 'function') {
                    match = matcher(template)
                } else if (matcher instanceof RegExp) {
                    match = matcher.exec(template)
                } else {
                    throw new Error()
                }
                if (match === null) continue
                const [, token, rest] = match
                chunks.push([tokenMatchers[tMIdx][0], token])
                template = rest
                continue templateLoop
            }
            throw new Error(`Unrecognized token at ${template}`)
        }
    }
    return chunks
}
