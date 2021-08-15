import { makeGuardFunction, setKey } from './action_guard'

test('setKey will return same thing if no special characters are used', () => {
    const result = setKey('note')
    expect(result).toBe('"note"')
})

test('setKey will return cognito reference if ! is used', () => {
    const result = setKey('!note')
    expect(result).toBe('$ctx.identity.claims.note')
})

test('setKey will return input reference if $ is used', () => {
    const result = setKey('$note')
    expect(result).toBe('$ctx.args.input.note')
})

test('makeGuardFunction will make CF JSON for guard vtl function', () => {
    const input = {
        field: 'getNote',
        index: 2,
        config: {
            pk: '!sub',
            sk: '$id'
        }
    }
    const result = makeGuardFunction(input)
    expect(result).toMatchSnapshot()
})

test('makeGuardFunction will target pk2 if its defined', () => {
    const input = {
        field: 'getNote',
        index: 2,
        config: {
            pk2: '!sub',
            sk: '$id'
        }
    }
    const result = makeGuardFunction(input)
    expect(result).toMatchSnapshot()
})
