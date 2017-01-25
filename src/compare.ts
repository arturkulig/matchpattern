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
    let diggedValue = value
    for (let i = 0; i < path.length; i++) {
        if (diggedValue === undefined) return
        if (diggedValue === null) return
        diggedValue = diggedValue[path[i]]
    }
    return diggedValue
}

export const cache: [TemplateStringsArray, PathMatcher[]][] = []

export function getCachedMatcher(template: TemplateStringsArray): PathMatcher[] {
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

export function getTemplateMatcher(template: TemplateStringsArray): PathMatcher[] {
    const matchers = []
    getMatcher(sliceTemplate(template), matchers, [])
    return matchers
}

export function getMatcher(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    const [[type, token]] = template
    switch (true) {
        case (type === TemplateChunkType.Ref): {
            getRefMatchers(template, matchers, currentPath)
            return
        }
        case (isNoToken(token)): {
            template.shift()
            getMatcher(template, matchers, currentPath)
            return
        }
        case (isTokenOfObject(token)): {
            getObjectMatchers(template, matchers, currentPath)
            return
        }
        case (isTokenOfArray(token)): {
            getArrayMatchers(template, matchers, currentPath)
            return
        }
        case (isTokenOfString(token)): {
            getStringMatchers(template, matchers, currentPath)
            return
        }
        case (isTokenOfNumber(token)): {
            getNumberMatchers(template, matchers, currentPath)
            return
        }
        case (isTokenOfAny(token)): {
            getAnyMatchers(template, matchers, currentPath)
            return
        }
        case (isTokenOfOutput(token)): {
            getOutputMatchers(template, matchers, currentPath)
            return
        }
    }
    throw new Error('token unmatched: ' + token)
}

function getOutputMatchers(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    const outputChunk = template.shift() as TemplateTextChunk
    const key = outputChunk[1].trim()
    matchers.splice(matchers.length, 0, [
        currentPath,
        (value, refs, output) => {
            output[key] = value
            return true
        }
    ])
}

function getRefMatchers(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    const refChunk = template.shift()
    matchers.splice(matchers.length, 0, [
        currentPath,
        (value, refs) => value === refs[refChunk[1]]
    ])
}

function getObjectMatchers(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    template.shift() // pop bracket

    matchers.splice(matchers.length, 0, [currentPath, value => (typeof value === 'object' && value !== null)])
    let keys: string[] = []

    while (true) {
        suckSpaces(template)

        if (template[0][0] === TemplateChunkType.Ref) {
            throw new Error()
        }

        if (template[0][1] === '}') {
            matchers.splice(matchers.length, 0, [
                currentPath,
                (value) => (
                    Object.keys(value).length === keys.length &&
                    Object.keys(value).reduce((result, key, i) => result && (keys.indexOf(key) >= 0), true)
                )
            ])
            template.shift()
            return
        }

        if (template[0][1] === ',') {
            template.shift()
            continue
        }

        suckSpaces(template)
        const keyChunk = template.shift()

        suckSpaces(template)
        const colon = template.shift()
        if (colon[1] !== ':') throw new Error()

        if (keyChunk[0] !== TemplateChunkType.Text) throw new Error()
        const key = (keyChunk[1] as string).trim()
        keys.push(key)

        const innerPath = currentPath.concat()
        innerPath.push(key)
        getMatcher(template, matchers, innerPath)
    }
}

function getArrayMatchers(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    template.shift() // pop bracket

    matchers.splice(matchers.length, 0, [currentPath, value => (typeof value === 'object' && value instanceof Array)])
    let length = 0

    while (true) {
        suckSpaces(template)

        if (template[0][0] === TemplateChunkType.Text && template[0][1] === ']') {
            matchers.splice(matchers.length, 0, [
                currentPath,
                (value) => value.length === length
            ])
            template.shift()
            return matchers
        }

        if (template[0][1] === ',') {
            template.shift()
            continue
        }

        getMatcher(template, matchers, currentPath.concat([length++]))
    }
}

function getStringMatchers(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    const quoteChunk = template.shift() as TemplateTextChunk
    let text = ''

    while (true) {
        if (template[0][0] === TemplateChunkType.Ref) throw new Error()
        if (template[0][1] === quoteChunk[1]) {
            template.shift()
            matchers.splice(matchers.length, 0, [
                currentPath,
                (value) => value === text
            ])
            return
        }
        text += template.shift()[1]
    }
}

function getNumberMatchers(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    const numberChunk = template.shift() as TemplateTextChunk
    const num = parseFloat(numberChunk[1])
    matchers.splice(matchers.length, 0, [
        currentPath,
        value => value === num
    ])
}

function getAnyMatchers(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    const soapChunk = template.shift() as TemplateTextChunk
    matchers.splice(matchers.length, 0, [
        currentPath,
        () => true
    ])
}

function isTokenOfAny(token) {
    return /^\s*_\s*$/.test(token)
}

function isTokenOfObject(token) {
    return token === '{'
}

function isTokenOfArray(token) {
    return token === '['
}

function isTokenOfString(token) {
    return /('|")+/.test(token)
}

function isTokenOfNumber(token) {
    return /^\s*[0-9]+\s*$/.test(token)
}

function isNoToken(token) {
    return token.trim() === ''
}

function isTokenOfOutput(token) {
    return /^\s*[a-zA-Z0-9_]+\s*$/.test(token)
}

function suckSpaces(template: TemplateChunk[]) {
    let type, token
    while (([[type, token]] = template, type === TemplateChunkType.Text && isNoToken(token))) {
        template.shift()
    }
}