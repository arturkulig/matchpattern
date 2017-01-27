# matchpattern

`matchpattern` is a library enabling performing pattern matching.

## Example

```JavaScript
import { match, when } from 'matchpattern'

const response = { status: 200, body: 'hello world' }

const result = match(response, [

    when `{ status: 200, body: contents }`(
        ({contents}) => contents
    ),

    when `{ status: status, body: _ }` (
        ({status}) => throw new Error(`HTTP ${status}`)
    ),
    
    when `_` (
        () => throw new Error('Malformed response object')
    )

])

console.log(result) // 'hello world'
```

## Usage

```
match(valueToMatch, [
    when `condition pattern` (
        condition handler
    ),
    ...
])
```

## Patterns

| Example | Name | Description |
|---|---|---|
|`420`|number|Matches a number|
|`"yolo"`|string|Matches a string| 
|`{a: 1}`|object|Matches an object with exact keys as in pattern and matching values|
|`[1]`|array|Matches an array with exactly same value and therefore - length|
|`_`|any value|Matches everything. Useful when matching objects and arrays.|
|`[a-zA-Z0-9]`|output|Match any value and export using provided name to condition handler|
|`...`|fold|Matches any remaining values in object and arrays|
|`...[a-zA-Z0-9]`|named fold|Matches any remaining values in object and arrays, then exports these to condition handler|

## Installation

Once it's out of WIP state, it will be published on npm.
```
npm install --save matchpattern
```

## Performance

Following table represents timings of execution with different number of these executions following another immediately.
Caching relates to caching parsed expressions passed to `when` as tagged template string.

### run 100000 times
|cached|method|execution time of a match case|
|---|---|---|
|uncached|(first run)|267.67 µs|
|cached|average|2.227 µs|
|cached|median|1.951 µs|

### run 10000 times
|cached|method|execution time of a match case|
|---|---|---|
|uncached|(first run)|145.383 µs|
|cached|average|2.265 µs|
|cached|median|1.986 µs|

### run 1000 times
|cached|method|execution time of a match case|
|---|---|---|
|uncached|(first run)|181.714 µs|
|cached|average|3.194 µs|
|cached|median|2.407 µs|

### run 100 times
|cached|method|execution time of a match case|
|---|---|---|
|uncached|(first run)|62.816 µs|
|cached|average|2.067 µs|
|cached|median|1.991 µs|

### run 10 times
|cached|method|execution time of a match case|
|---|---|---|
|uncached|(first run)|68.746 µs|
|cached|average|2.642 µs|
|cached|median|2.441 µs|