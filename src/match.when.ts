import { compare } from './compare'

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
    throw new Error(`${valueToMatch} is unmatched`)
}

export type WhenResult<T> = (result: Result<T>) => Matcher<T>

const jsonCache = {}
const emptyMatcherResult = [null, null]
export function when<T>(template: TemplateStringsArray, ...refs: any[]): WhenResult<T> {
    return (result: Result<T>) => value => {
        const output = compare(value, template, refs)
        if (output === null) return (emptyMatcherResult as MatcherResult<T>)
        return [output, result] as MatcherResult<T>
    }
}