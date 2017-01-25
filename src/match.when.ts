import { compare } from './compare'
import * as isEqual from 'lodash.isequal'

export type FunctionResult<T> = (output: { [id: string]: any }) => T
export type Result<T> = T | FunctionResult<T>
export type MatcherResult<T> = [{ [id: string]: any } | null, Result<T>]
export type Matcher<T> = (value) => MatcherResult<T>

export function match<T>(valueToMatch, matchers: Matcher<T>[] = []): T {
    for (let i = 0; i < matchers.length; i++) {
        let [output, result] = matchers[i](valueToMatch)
        if (output === null) continue
        if (typeof result === 'function') {
            return result(output)
        }
        return result
    }
}

export type WhenResult<T> = (result: Result<T>) => Matcher<T>
export function when<T>(template: TemplateStringsArray, ...refs: any[]): WhenResult<T>  {
    if (template.length === 1 && refs.length === 0 && isJSON(template[0])) {
        const pattern = JSON.parse(template[0])
        return (result: Result<T>) => value => {
            return isEqual(value, pattern) ? [{}, result] : ([null, null] as MatcherResult<T>)
        }
    }
    return (result: Result<T>) => value => {
        const output = compare(value, template, refs)
        if (output === null) return ([null, null] as MatcherResult<T>)
        return [output, result] as MatcherResult<T>
    }
}

function isJSON(value) {
    try {
        JSON.parse(value)
        return true
    } catch (e) {
        return false
    }
}