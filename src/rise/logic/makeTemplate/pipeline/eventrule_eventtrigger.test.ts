import { makeEventRule } from './eventrule_eventtrigger'

test('makeEventRule will render valid cloudformation', () => {
    const result = makeEventRule({
        apiName: 'apiName',
        eventName: 'eventName',
        index: 2,
        eventBus: 'eventBus',
        eventSource: 'eventSource'
    })

    expect(result).toMatchSnapshot()
})
