import { compare } from './compare'
export { cache } from './compare'

export type FunctionResult<T> = (output: { [id: string]: any }) => T
export type Result<T> = T | FunctionResult<T>
export type MatcherResult<T> = [{ [id: string]: any } | null, Result<T>]
export type Matcher<T> = (value) => MatcherResult<T>
export type WhenResult<T> = (result: Result<T>) => Matcher<T>

export function is(template: TemplateStringsArray, ...refs: any[]): (valueToMatch) => boolean {
    return valueToMatch => compare(valueToMatch, template, refs) !== null
}

export function isNot(template: TemplateStringsArray, ...refs: any[]): (valueToMatch) => boolean {
    return valueToMatch => compare(valueToMatch, template, refs) === null
}

export function match<T>(matchers: Matcher<T>[]): (valueToMatch) => T
export function match<T>(valueToMatch, matchers: Matcher<T>[]): T
export function match<T>(...args: any[]) {
    if (args.length === 0) throw new Error('Issuficient number of arguments')
    if (args.length === 1) return (valueToMatch) => match(valueToMatch, args[0])

    let [valueToMatch, matchers] = args as [any, Matcher<T>[]]
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

const jsonCache = {}
const emptyMatcherResult = [null, null]
export function when<T>(template: TemplateStringsArray, ...refs: any[]): WhenResult<T> {
    return (result: Result<T>) => value => {
        const output = compare(value, template, refs)
        if (output === null) return (emptyMatcherResult as MatcherResult<T>)
        return [output, result] as MatcherResult<T>
    }
}