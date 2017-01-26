# match-pattern

`match-pattern` is a library enabling performing pattern matching.

## Example

```JavaScript
import { match, when } from 'match-pattern'

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
|`[a-zA-Z0-9_]`|output|Match any value and export using provided name to condition handler|
|`...`|fold|Matches any remaining values in object and arrays|
|`...[a-zA-Z0-9_]`|named fold|Matches any remaining values in object and arrays, then exports these to condition handler|

## Installation

Once it's out of WIP state, it will be published on npm.
```
npm install github:arturkulig/match-pattern
```