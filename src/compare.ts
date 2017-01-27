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
        case (isTokenOfRef(template)): {
            getRefMatchers(template, matchers, currentPath)
            return
        }
        case (isNoToken(template)): {
            template.shift()
            getMatcher(template, matchers, currentPath)
            return
        }
        case (isTokenOfString(template)): {
            getStringMatchers(template, matchers, currentPath)
            return
        }
        case (isTokenOfNumber(template)): {
            getNumberMatchers(template, matchers, currentPath)
            return
        }
        case (isTokenOfObject(template)): {
            getObjectMatchers(template, matchers, currentPath)
            return
        }
        case (isTokenOfArray(template)): {
            getArrayMatchers(template, matchers, currentPath)
            return
        }
        case (isTokenOfAny(template)): {
            getAnyMatchers(template, matchers, currentPath)
            return
        }
        case (isTokenOfOutput(template)): {
            getOutputMatchers(template, matchers, currentPath)
            return
        }
    }
    throw new Error('token unmatched: ' + token)
}

function getOutputMatchers(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    const outputChunk = template.shift() as TemplateTextChunk
    const key = outputChunk[1].trim()
    matchers.push([
        currentPath,
        (value, refs, output) => {
            output[key] = value
            return true
        }
    ])
}

function getRefMatchers(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    const refChunk = template.shift() as TemplateRefChunk
    const refIdx = refChunk[1]
    matchers.push([
        currentPath,
        (value, refs) => value === refs[refIdx]
    ])
}

function getObjectMatchers(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    template.shift() // pop bracket

    matchers.push([currentPath, value => (typeof value === 'object' && value !== null)])
    let keys: string[] = []

    while (true) {
        suckSpaces(template)

        if (isTokenOfRef(template)) {
            throw new Error()
        }

        if (template[0][0] === TemplateChunkType.ObjectEnd) {
            matchers.push([
                currentPath,
                (value) => (
                    Object.keys(value).length === keys.length &&
                    Object.keys(value).reduce((result, key, i) => result && (keys.indexOf(key) >= 0), true)
                )
            ])
            template.shift() // pop closing bracket
            return
        }

        if (template[0][0] === TemplateChunkType.Symbol && template[0][1] === ',') {
            template.shift()
            suckSpaces(template)

            if (isTokenOfFold(template)) {
                const outputChunk = (template.shift() as TemplateTextChunk) // pop tokens
                const outputName = outputChunk[1].substr(3)
                if (outputName.length > 0) {
                    matchers.push([
                        currentPath,
                        (value, refs, output) => {
                            const namedOutput = {}
                            for (let valueKey in value) {
                                if (!Object.prototype.hasOwnProperty.call(value, valueKey)) continue
                                if (keys.indexOf(valueKey) >= 0) continue
                                namedOutput[valueKey] = value[valueKey]
                            }
                            output[outputName] = namedOutput
                            return true
                        }
                    ])
                }
                suckSpaces(template)
                if (template.shift()[0] !== TemplateChunkType.ObjectEnd) {
                    throw new Error('Expected object closing bracket')
                }
                return
            }

            continue
        }

        suckSpaces(template)
        const keyChunk = template.shift()

        suckSpaces(template)
        const colon = template.shift()
        if (colon[1] !== ':') throw new Error()

        if (keyChunk[0] !== TemplateChunkType.Symbol) throw new Error()
        const key = (keyChunk[1] as string).trim()
        keys.push(key)

        const innerPath = currentPath.concat()
        innerPath.push(key)
        getMatcher(template, matchers, innerPath)
    }
}

function getArrayMatchers(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    template.shift() // pop bracket

    matchers.push([currentPath, value => (typeof value === 'object' && value instanceof Array)])
    let length = 0

    while (true) {
        suckSpaces(template)

        if (template[0][0] === TemplateChunkType.ArrayEnd) {
            matchers.push([
                currentPath,
                (value) => value.length === length
            ])
            template.shift() // pop closing bracket
            return matchers
        }

        if (template[0][1] === ',') {
            template.shift()
            suckSpaces(template)

            if (isTokenOfFold(template)) {
                const outputChunk = (template.shift() as TemplateTextChunk) // pop tokens
                const outputName = outputChunk[1].substr(3)
                if (outputName.length > 0) {
                    matchers.push([
                        currentPath,
                        (value, refs, output) => {
                            output[outputName] = value.slice(length)
                            return true
                        }
                    ])
                }
                suckSpaces(template)
                if (template.shift()[0] !== TemplateChunkType.ArrayEnd) {
                    throw new Error('Expected object closing bracket')
                }
                return
            }
            continue
        }

        getMatcher(template, matchers, currentPath.concat([length++]))
    }
}

function getStringMatchers(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    const stringChunk = template.shift() as TemplateTextChunk
    const text = stringChunk[1].substr(1, stringChunk[1].length - 2)
    matchers.push([
        currentPath,
        (value) => value === text
    ])
}

function getNumberMatchers(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    const numberChunk = template.shift() as TemplateTextChunk
    const num = parseFloat(numberChunk[1])
    matchers.push([
        currentPath,
        value => value === num
    ])
}

function getAnyMatchers(template: TemplateChunk[], matchers: PathMatcher[], currentPath: Path) {
    const soapChunk = template.shift() as TemplateTextChunk
    matchers.push([
        currentPath,
        () => true
    ])
}

function isTokenOfFold(template: TemplateChunk[]) {
    return template[0][0] === TemplateChunkType.Fold
}

function isTokenOfAny(template: TemplateChunk[]) {
    return template[0][0] === TemplateChunkType.Blank
}

function isTokenOfObject(template: TemplateChunk[]) {
    return template[0][0] === TemplateChunkType.ObjectStart
}

function isTokenOfArray(template: TemplateChunk[]) {
    return template[0][0] === TemplateChunkType.ArrayStart
}

function isTokenOfString(template: TemplateChunk[]) {
    return template[0][0] === TemplateChunkType.String
}

function isTokenOfNumber(template: TemplateChunk[]) {
    return template[0][0] === TemplateChunkType.Number
}

function isNoToken(template: TemplateChunk[]) {
    return template[0][0] === TemplateChunkType.Space
}

function isTokenOfOutput(template: TemplateChunk[]) {
    return template[0][0] === TemplateChunkType.Symbol
}

function isTokenOfRef(template: TemplateChunk[]) {
    return template[0][0] === TemplateChunkType.Ref
}

function suckSpaces(template: TemplateChunk[]) {
    while (isNoToken(template)) {
        template.shift()
    }
}