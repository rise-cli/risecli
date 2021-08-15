import { buildEventDetailInput, makeEmitEvent } from './action_emitevent'

test('buildEventDetailInput will create a valid event detail object', () => {
    const input = {
        one: '1',
        two: 2
    }

    const result = buildEventDetailInput(input)
    expect(result).toBe('"{\\"one\\": \\"1\\",\\"two\\": \\"2\\"}"')
})

test('buildEventDetailInput will handle special characters correctly', () => {
    const input = {
        one: '!sub',
        two: '$input',
        three: '#dbvalue'
    }

    const result = buildEventDetailInput(input)
    expect(result).toBe(
        '"{\\"one\\": \\"$ctx.identity.claims.sub\\",\\"two\\": \\"$ctx.args.input.input\\",\\"three\\": \\"$ctx.stash.dbresult.dbvalue\\"}"'
    )
})

test('buildEventDetailInput will handle special characters correctly', () => {
    const input = {
        name: 'myevent',
        config: {
            source: 'source',
            eventBus: 'eventBus',
            event: 'event',
            detail: {
                one: '!sub',
                two: '$input',
                three: '#dbvalue'
            }
        }
    }

    const result = makeEmitEvent(input)
    expect(result).toMatchSnapshot()
})
