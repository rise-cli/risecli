import { buildEventInput, makeLambdaEventTrigger } from './lambda_eventtrigger'

test('buildEventInput will create valid js object', () => {
    const result = buildEventInput({
        one: 'one',
        two: 'two',
        three: 'three'
    })

    expect(result).toBe('{one: props.one,two: props.two,three: props.three}')
})

test('makeLambdaEventTrigger will render correctly', () => {
    const result = makeLambdaEventTrigger({
        apiName: 'apiName',
        eventName: 'eventName',
        index: 2,
        query: `query`,
        eventInput: {
            one: 'one',
            two: 'two',
            three: 'three'
        }
    })

    expect(result).toMatchSnapshot()
})
