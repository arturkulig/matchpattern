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
export type ParserOutput = PathMatcher[]

export function compare(value: any, template: TemplateStringsArray, refs: any[]) {
    const output = {}
    const matchers = getCachedMatcher(template)
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
    return getDeep(value[path[0]], path.slice(1))
}

export const cache: [TemplateStringsArray, PathMatcher[]][] = []

export function getCachedMatcher(template: TemplateStringsArray): ParserOutput {
    cacheLoop:
    for (let cacheIdx = 0; cacheIdx < cache.length; cacheIdx++) {
        for (let partIdx = 0; partIdx < Math.max(cache[cacheIdx].length, cache[cacheIdx][0].length); partIdx++) {
            if (cache[cacheIdx][0][partIdx] !== template[partIdx]) continue cacheLoop
        }
        return cache[cacheIdx][1]
    }
    const freshParserOutput = getTemplateMatcher(template)
    cache.push([template, freshParserOutput])
    return freshParserOutput
}

export function getTemplateMatcher(template: TemplateStringsArray): ParserOutput {
    return getMatcher(sliceTemplate(template))
}

export function getMatcher(template: TemplateChunk[], currentPath: Path = []): ParserOutput {
    const [[type, token]] = template
    switch (true) {
        case (type === TemplateChunkType.Ref): {
            return getRefMatchers(template, currentPath)
        }
        case (isNoToken(token)): {
            template.splice(0, 1)
            return getMatcher(template, currentPath)
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
    const [outputChunk] = template.splice(0, 1) as TemplateTextChunk[]
    const key = outputChunk[1].trim()
    return [[
        currentPath,
        (value, refs, output) => {
            output[key] = value
            return true
        }
    ]]
}

function getRefMatchers(template: TemplateChunk[], currentPath: Path): ParserOutput {
    const [refChunk] = template.splice(0, 1) as TemplateRefChunk[]
    return [[
        currentPath,
        (value, refs) => value === refs[refChunk[1]]
    ]]
}

function getObjectMatchers(template: TemplateChunk[], currentPath: Path): ParserOutput {
    template.splice(0, 1) // pop bracket

    let matchers: PathMatcher[] = [[currentPath, value => (typeof value === 'object' && value !== null)]]
    let keys: string[] = []

    while (true) {
        suckSpaces(template)

        if (template[0][0] === TemplateChunkType.Ref) {
            throw new Error()
        }

        if (template[0][1] === '}') {
            matchers.push([
                currentPath,
                (value) => (
                    Object.keys(value).length === keys.length &&
                    Object.keys(value).reduce((result, key, i) => result && (keys.indexOf(key) >= 0), true)
                )
            ])
            template.splice(0, 1)
            return matchers
        }

        if (template[0][1] === ',') {
            template.splice(0, 1)
            continue
        }

        suckSpaces(template)
        const [keyChunk] = template.splice(0, 1)

        suckSpaces(template)
        const [colon] = template.splice(0, 1)
        if (colon[1] !== ':') throw new Error()

        if (keyChunk[0] !== TemplateChunkType.Text) throw new Error()
        const key = (keyChunk[1] as string).trim()
        keys = [...keys, key as string]

        const innerPath = currentPath.concat()
        innerPath.push(key)
        matchers = matchers.concat(getMatcher(template, innerPath))
    }
}

function getArrayMatchers(template: TemplateChunk[], currentPath: Path): ParserOutput {
    template.splice(0, 1) // pop bracket

    let matchers: PathMatcher[] = [[currentPath, value => (typeof value === 'object' && value instanceof Array)]]
    let length = 0

    while (true) {
        suckSpaces(template)

        if (template[0][0] === TemplateChunkType.Text && template[0][1] === ']') {
            matchers.push([
                currentPath,
                (value) => value.length === length
            ])
            template.splice(0, 1)
            return matchers
        }

        if (template[0][1] === ',') {
            template.splice(0, 1)
            continue
        }

        matchers = matchers.concat(getMatcher(template, currentPath.concat([length++])))
    }
}

function getStringMatchers(template: TemplateChunk[], currentPath: Path): ParserOutput {
    const [quoteChunk] = template.splice(0, 1) as TemplateTextChunk[]
    let text = ''

    while (true) {
        if (template[0][0] === TemplateChunkType.Ref) throw new Error()
        if (template[0][1] === quoteChunk[1]) {
            template.splice(0, 1)
            return [[
                currentPath,
                (value) => value === text
            ]]
        }
        text += template.splice(0, 1)[0][1]
    }
}

function getNumberMatchers(template: TemplateChunk[], currentPath: Path): ParserOutput {
    const [numberChunk] = template.splice(0, 1) as TemplateTextChunk[]
    const num = parseFloat(numberChunk[1])
    return [[
        currentPath,
        value => value === num
    ]]
}

function getAnyMatchers(template: TemplateChunk[], currentPath: Path): ParserOutput {
    const [soapChunk] = template.splice(0, 1) as TemplateTextChunk[]
    return [[
        currentPath,
        () => true
    ]]
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