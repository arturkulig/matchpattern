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

...also factorial function can be implemented with `matchpattern`...

```JavaScript
function fact(n) {
  return match(n, [
    when `0` (1),
    when `_` (() => n * fact(n-1))
  ]);
}
```

...although it is probably not the best idea as it is much slower than regular solution.
**It is definitely a tool to speed up developement and improve readability of code, rather than execution time.**

## Usage

Matching simple strings and numbers can be done, but simple cases `switch` statement will be a better choice.

### match objects

```JavaScript
console.log(
    match(someObject, [

        // print whats at someObject.a.b.c
        when `{a:{b:{c: namedValue}}}` (({namedValue}) => namedValue),

        // print someObject object, but leave 'a' property if that matches
        when `{a: 1, ...namedValue}` (({namedValue}) => namedValue),

        // print true if someObject.a === 1 and b is actually sameOtherObject
        when `{a: 1, b: ${someOtherObject}}` (true),

    ])
)
```

### match arrays

```JavaScript
console.log(
    match(someArray, [
        
        // print a value pulled from someArray[4][1] when someArray[4][0] === 200
        // while not checking someArray length
        when`[_, _, _, _, [200, value], ...]`(({value}) => value)

        // print a tuple with first element and array containing all other values in original order
        when`[head, ...tail]`(({head, tail}) => [head, tail])

        // print someArray when it is an empty array
        when`[]`([])
        
    ])
)
```

### match references

When you break a template with a inserted value, `matchpattern` will use strict equation to compare these

```JavaScript
const someObject = {a: 1}

someObject === match([someObject], [
    when`[${someObject}]`(someObject)
]) // true

```

Although as rules are applied from top to bottom, similarity will win over reference as reference will never be checked if such rule is lower than one that is satisfied.

```JavaScript
const someObject = {a: 1}

someObject === match([someObject], [
    when`[{a: 1}]`('oops!')
    when`[${someObject}]`(someObject)
]) // false

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

```
npm install --save matchpattern
```

## Performance

Following table represents timings of execution with different number of these executions following another immediately.
Caching relates to caching parsed expressions passed to `when` as tagged template string.

### run 100000 times
|cached|method|execution time of a match case|
|---|---|---|
|uncached|(first run)|206.489 µs|
|cached|average|2.141 µs|
|cached|median|1.923 µs|

### run 10000 times
|cached|method|execution time of a match case|
|---|---|---|
|uncached|(first run)|147.627 µs|
|cached|average|2.274 µs|
|cached|median|2.092 µs|

### run 1000 times
|cached|method|execution time of a match case|
|---|---|---|
|uncached|(first run)|174.146 µs|
|cached|average|3 µs|
|cached|median|2.319 µs|

### run 100 times
|cached|method|execution time of a match case|
|---|---|---|
|uncached|(first run)|62.234 µs|
|cached|average|2.826 µs|
|cached|median|1.98 µs|

### run 10 times
|cached|method|execution time of a match case|
|---|---|---|
|uncached|(first run)|105.072 µs|
|cached|average|4.031 µs|
|cached|median|3.672 µs|