const { match, when, cache } = require('./performance/match')

const noop = () => { }
const repeats = [1e5, 1e4, 1e3, 1e2, 1e1]

function matches() {
    match(2, [
        when`1`(noop),
        when`_`(noop)
    ])
    match({ a: { b: { c: 42 }, d: 12 } }, [
        when`1`(noop),
        when`{a: [42, 24], ...}`(noop),
        when`{a: {b: {c: discovery}, d: _}}`(noop),
        when`_`(noop)
    ])
    match([1, 2, 3, 4, 5, 6, 7, 8, 9, 0], [
        when`[${{}}]`(noop),
        when`[1, "2", 3, {a: ${Math.random()}}, _, 6, 7, 8, 9]`(noop),
        when`_`(noop)
    ])
}
// force into optimizing
// so all tests are run
// in the same environment
for (let i = 0; i < 1e5; i++) matches()

function test() {
    const repeat = repeats.shift()
    if (!repeat) return

    cache.splice(0)
    const times = []
    for (let i = 0; i < repeat; i++) {
        const t1 = process.hrtime()
        matches()
        const [sec, nsec] = process.hrtime(t1)
        times.push((sec * 1e9 + nsec) / 3)
    }

    const nanoToMili = v => v / 1e3
    const min = times.reduce((min, time) => Math.min(min, time), Number.MAX_VALUE)
    const timesSorted = times.concat([]).sort((a, b) => Math.sign(a - b))
    const formatTime = v => `${Math.round(nanoToMili(v) * 1e3) / 1e3} µs`

    console.log('')
    console.log('### run', repeat, 'times')
    console.log('|cached|method|execution time of a match case|')
    console.log('|---|---|---|')
    const uncached = times[0]
    const cached = times.slice(1).reduce((sum, time) => sum + time) / (times.length - 1)
    console.log(`|uncached|(first run)|${formatTime(uncached)}|`)
    console.log(`|cached|average|${formatTime(cached)}|`)
    console.log(`|cached|median|${formatTime(times.slice(1).sort((a, b) => Math.sign(a - b))[times.length / 2])}|`)

    setTimeout(test, 1000)
}

setTimeout(test, 1000)
