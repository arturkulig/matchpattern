import {
    TemplateChunk,
    TemplateChunkType,
    TemplateRefChunk,
    TemplateTextChunk,
    sliceTemplate
} from './sliceTemplate'

export type PathPart = string | number
export type Path = PathPart[]
export type Matcher = (value, refs: any[], output: {}) => boolean
export type PathMatcher = [Path, Matcher]
export type ParserOutput = { matchers: PathMatcher[], template: TemplateChunk[] }

export function compare(value: any, template: TemplateStringsArray, refs: any[]) {
    const output = {}
    const { matchers } = getCachedMatcher(template)
    for (let i = 0; i < matchers.length; i++) {
        const [path, matcher] = matchers[i]
        if (!matcher(getDeep(value, path), refs, output)) {
            return null
        }
    }
    return output
}

function getDeep(value: any, path: Path) {
    if (path.length === 0) return value
    if (value === undefined) return
    if (value === null) return
    const [key, ...rest] = path
    return getDeep(value[key], rest)
}

const cache: [TemplateStringsArray, PathMatcher[]][] = []
export function getCachedMatcher(template: TemplateStringsArray): ParserOutput {
    cacheLoop:
    for (let cacheIdx = 0; cacheIdx < cache.length; cacheIdx++) {
        for (let partIdx = 0; partIdx < Math.max(cache[cacheIdx].length, cache[cacheIdx][0].length); partIdx++) {
            if (cache[cacheIdx][0][partIdx] !== template[partIdx]) continue cacheLoop
        }
        return { matchers: cache[cacheIdx][1], template: [] }
    }
    const freshParserOutput = getTemplateMatcher(template)
    cache.push([template, freshParserOutput.matchers])
    return freshParserOutput
}

export function getTemplateMatcher(template: TemplateStringsArray) {
    return getMatcher(sliceTemplate(template))
}

export function getMatcher(template: TemplateChunk[], currentPath: Path = []): ParserOutput {
    const [[type, token]] = template
    switch (true) {
        case (type === TemplateChunkType.Ref): {
            return getRefMatchers(template, currentPath)
        }
        case (isNoToken(token)): {
            return getMatcher(template.slice(1), currentPath)
        }
        case (isTokenOfObject(token)): {
            return getObjectMatchers(template, currentPath)
        }
        case (isTokenOfArray(token)): {
            return getArrayMatchers(template, currentPath)
        }
        case (isTokenOfString(token)): {
            return getStringMatchers(template, currentPath)
        }
        case (isTokenOfNumber(token)): {
            return getNumberMatchers(template, currentPath)
        }
        case (isTokenOfAny(token)): {
            return getAnyMatchers(template, currentPath)
        }
        case (isTokenOfOutput(token)): {
            return getOutputMatchers(template, currentPath)
        }
    }
    throw new Error('token unmatched: ' + token)
}

function getOutputMatchers(template: TemplateChunk[], currentPath: Path): ParserOutput {
    let remainingTemplate = template.concat([])
    const [outputChunk] = remainingTemplate.splice(0, 1) as TemplateTextChunk[]
    const key = outputChunk[1].trim()
    return {
        matchers: [[
            currentPath,
            (value, refs, output) => {
                output[key] = value
                return true
            }
        ]],
        template: remainingTemplate
    }
}

function getRefMatchers(template: TemplateChunk[], currentPath: Path): ParserOutput {
    let remainingTemplate = template.concat([])
    const [refChunk] = remainingTemplate.splice(0, 1) as TemplateRefChunk[]
    return {
        matchers: [[
            currentPath,
            (value, refs) => value === refs[refChunk[1]]
        ]],
        template: remainingTemplate
    }
}

function getObjectMatchers(template: TemplateChunk[], currentPath: Path): ParserOutput {
    let remainingTemplate = template.concat([])
    const [bracketChunk] = remainingTemplate.splice(0, 1)

    let matchers: PathMatcher[] = [[currentPath, value => (typeof value === 'object' && value !== null)]]
    let keys: string[] = []

    while (true) {
        suckSpaces(remainingTemplate)

        if (remainingTemplate[0][0] === TemplateChunkType.Ref) {
            throw new Error()
        }

        if (remainingTemplate[0][1] === '}') {
            matchers = [
                ...matchers,
                [
                    currentPath,
                    (value) => (
                        Object.keys(value).length === keys.length &&
                        Object.keys(value).reduce((result, key, i) => result && (keys.indexOf(key) >= 0), true)
                    )
                ]
            ]
            return { matchers, template: remainingTemplate.slice(1) }
        }

        if (remainingTemplate[0][1] === ',') {
            remainingTemplate = remainingTemplate.slice(1)
            continue
        }

        suckSpaces(remainingTemplate)
        const [keyChunk] = remainingTemplate.splice(0, 1)

        suckSpaces(remainingTemplate)
        const [colon] = remainingTemplate.splice(0, 1)
        if (colon[1] !== ':') throw new Error()

        if (keyChunk[0] !== TemplateChunkType.Text) throw new Error()
        const key = (keyChunk[1] as string).trim()
        keys = [...keys, key as string]

        const innerPath = [...currentPath, key]
        const result: ParserOutput = getMatcher([...remainingTemplate], innerPath)

        matchers = [...matchers, ...result.matchers]
        remainingTemplate = result.template
    }
}

function getArrayMatchers(template: TemplateChunk[], currentPath: Path): ParserOutput {
    let remainingTemplate = template.concat([])
    const [bracketChunk] = remainingTemplate.splice(0, 1)

    let matchers: PathMatcher[] = [[currentPath, value => (typeof value === 'object' && value instanceof Array)]]
    let length = 0

    while (true) {
        suckSpaces(remainingTemplate)

        if (remainingTemplate[0][0] === TemplateChunkType.Text && remainingTemplate[0][1] === ']') {
            matchers.push([
                currentPath,
                (value) => value.length === length
            ])
            return { matchers, template: remainingTemplate.slice(1) }
        }

        if (remainingTemplate[0][1] === ',') {
            remainingTemplate.splice(0, 1)
            continue
        }

        const result: ParserOutput = getMatcher([...remainingTemplate], [...currentPath, length++])

        matchers = [...matchers, ...result.matchers]
        remainingTemplate = result.template
    }
}

function getStringMatchers(template: TemplateChunk[], currentPath: Path): ParserOutput {
    let remainingTemplate = template.concat([])
    const [quoteChunk] = remainingTemplate.splice(0, 1) as TemplateTextChunk[]
    let text = ''

    while (true) {
        if (remainingTemplate[0][0] === TemplateChunkType.Ref) throw new Error()
        if (remainingTemplate[0][1] === quoteChunk[1]) {
            remainingTemplate = remainingTemplate.slice(1)
            break
        }
        text += remainingTemplate.splice(0, 1)[0][1]
    }
    return {
        matchers: [[
            currentPath,
            (value) => value === text
        ]],
        template: remainingTemplate
    }
}

function getNumberMatchers(template: TemplateChunk[], currentPath: Path): ParserOutput {
    let remainingTemplate = template.concat([])
    const [numberChunk] = remainingTemplate.splice(0, 1) as TemplateTextChunk[]
    const num = parseFloat(numberChunk[1])
    return {
        matchers: [[
            currentPath,
            value => value === num
        ]],
        template: remainingTemplate
    }
}

function getAnyMatchers(template: TemplateChunk[], currentPath: Path): ParserOutput {
    let remainingTemplate = template.concat([])
    const [soapChunk] = remainingTemplate.splice(0, 1) as TemplateTextChunk[]
    return {
        matchers: [[
            currentPath,
            () => true
        ]],
        template: remainingTemplate
    }
}

function isTokenOfAny(token) {
    return token.trim() === '_'
}

function isTokenOfObject(token) {
    return token === '{'
}

function isTokenOfArray(token) {
    return token === '['
}

function isTokenOfString(token) {
    return !!token.match(/('|")+/)
}

function isTokenOfNumber(token) {
    return !!token.match(/\s*[0-9]+\s*/)
}

function suckSpaces(template: TemplateChunk[]) {
    let type, token
    while (([[type, token]] = template, type === TemplateChunkType.Text && isNoToken(token))) {
        template.splice(0, 1)
    }
}

function isNoToken(token) {
    return token.trim() === ''
}

function isTokenOfOutput(token) {
    return !!token.trim().match(/^[a-zA-Z]+$/)
}