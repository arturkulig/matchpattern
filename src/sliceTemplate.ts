export enum TemplateChunkType {
    Text,
    Ref,
}

export type TemplateTextChunk = [TemplateChunkType.Text, string]
export type TemplateRefChunk = [TemplateChunkType.Ref, number]
export type TemplateChunk =
    TemplateTextChunk |
    TemplateRefChunk

export function sliceTemplate(s: TemplateStringsArray) {
    let chunks = []
    let refCount = 0
    for (let i = 0; i < s.length; i++) {
        if (i > 0) {
            chunks.push([TemplateChunkType.Ref, refCount++])
        }
        tokenize(s[i])
            .map(part => ([TemplateChunkType.Text, part] as TemplateChunk))
            .forEach(chunk => chunks.push(chunk))
    }
    return chunks
}

function tokenize(s: string) {
    return (s.match(/([a-z0-9$_ ]+|[^a-z0-9$_ ]{1})/gi) || [])
}