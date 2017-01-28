const { match, when, cache } = require('./performance/match')

function fact_pattern(n) {
    let result = 1
    for (let i = n; i >= 0; i--) {
        result *= match(i, [
            when`${0}`(1),
            when``(n)
        ])
    }
    return result
}

function fact_native(n) {
    let result = 1
    for (let i = n; i >= 0; i--) {
        result *= (
            n === 0
                ? 1
                : n
        )
    }
    return result
}

for (let i = 0; i < 1e5; i++) (fact_pattern(10), fact_native(1))

const times = {
    pattern: [],
    native: []
}

const samples = [1e2, 1e3, 1e4, 1e5]

const timeToNano = ([sec, nsec]) => sec * 1e9 + nsec
const nanoToMili = v => v / 1e3
const formatTime = v => `${Math.round(nanoToMili(timeToNano(v)) * 1e3) / 1e3} µs`

for (let sample of samples) {
    cache.splice(0)

    const pt1 = process.hrtime()
    fact_pattern(sample)
    const ptd = process.hrtime(pt1)

    const pct1 = process.hrtime()
    fact_pattern(sample)
    const pctd = process.hrtime(pct1)

    const nt1 = process.hrtime()
    fact_native(sample)
    const ntd = process.hrtime(nt1)

    console.log(`fact(${sample}) = pattern-${formatTime(ptd)}, pattern cached-${formatTime(pctd)}, native-${formatTime(ntd)}`)
    console.log(`uncached ${(timeToNano(ptd) / timeToNano(ntd)) | 0} times slower`)
    console.log(`cached ${(timeToNano(pctd) / timeToNano(ntd)) | 0} times slower`)
    console.log('---')
}