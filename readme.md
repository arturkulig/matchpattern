# match-pattern

`match-pattern` is a library enabling performing pattern matching.

```JavaScript
import { match, when } from 'match-pattern'

const response = { status: 200, body: 'hello world' }

const result = match(response, {

    when `{ status: 200, body: contents }`(
        ({contents}) => contents
    )

    when `{ status: status, body: _ }` (
        ({status}) => throw new Error(`HTTP ${status}`)
    )
    
    when `_` (
        () => throw new Error('Malformed response object')
    )

})

console.log(result) // 'hello world'
```

## Patterns

| Example | Description |
|---|---|
|`420`|numbers|
|`"yolo"`|strings|
|`{a: 1}`|objects|
|`[1]`|arrays|
|`_`|any value (useful when matching objects and arrays as those are checked for length too)|
|`[a-zA-Z0-9_]`|output (match any value and export using provided name)|

## Installation

Once it's out of WIP state, it will be published on npm.
```
npm install github:arturkulig/match-pattern
```