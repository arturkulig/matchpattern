const { match, when, cache } = require('./performance/match')

const noop = () => { }
const repeats = [1e5, 1e4, 1e3, 1e2, 1e1]

function matches() {
    match(2, [
        when`1`(noop),
        when`_`(noop)
    ])
    match({ a: { b: { c: 42 } } }, [
        when`1`(noop),
        when`{a: [42, 24]}`(noop),
        when`{a: {b: {c: discovery}}}`(noop),
        when`_`(noop)
    ])
    match([1, 2, 3, 4, 5, 6, 7, 8, 9, 0], [
        when`[1, "2", 3, {a: ${Math.random()}}, _, 6, 7, 8, 9]`(noop),
        when`_`(noop)
    ])
}
// force to optimize
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
    function summarize(label, times) {
        console.log('')
        console.log(label)
        const resolution = 10
        console.log(`0/${resolution} ${formatTime(times[0])}\t${Math.round(100 * times[0] / min)}%`)
        for (let i = 1; i < resolution; i++)
            console.log(`${i}/${resolution} ${
                formatTime(times[Math.ceil(times.length / resolution * i)])
                }\t${
                Math.round(100 * times[Math.ceil(times.length / resolution * i)] / min)
                }%`)
        console.log(`${resolution}/${resolution} ${formatTime(times[times.length - 1])}\t${Math.round(100 * times[times.length - 1] / min)}%`)
    }
    // summarize('timed', times)
    // summarize('sorted', timesSorted)

    console.log('')
    console.log('### run', repeat, 'times')
    console.log('|cached|method|time|')
    console.log('|---|---|---|')
    const uncached = times[0]
    const cached = times.slice(1).reduce((sum, time) => sum + time) / (times.length - 1)
    console.log(`|uncached|(first run)|${formatTime(uncached)}|`)
    console.log(`|cached|average|${formatTime(cached)}|`)
    console.log(`|cached|median|${formatTime(times.slice(1).sort((a, b) => Math.sign(a - b))[times.length / 2])}|`)

    setTimeout(test, 1000)
}

setTimeout(test, 1000)
