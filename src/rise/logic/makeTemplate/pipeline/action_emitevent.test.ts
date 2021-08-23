import { buildEventDetailInput, makeEmitEvent } from './action_emitevent'

test('buildEventDetailInput will create a valid event detail object', () => {
    const input = {
        one: '1',
        two: 2
    }

    const result = buildEventDetailInput(input)
    expect(result).toBe(
        '"{RISE_EVENT_QUOTEoneRISE_EVENT_QUOTE: RISE_EVENT_QUOTE1RISE_EVENT_QUOTE,RISE_EVENT_QUOTEtwoRISE_EVENT_QUOTE: RISE_EVENT_QUOTE2RISE_EVENT_QUOTE}"'
    )
})

test('buildEventDetailInput will handle special characters correctly', () => {
    const input = {
        one: '!sub',
        two: '$input',
        three: '#dbvalue'
    }

    const result = buildEventDetailInput(input)
    expect(result).toBe(
        '"{RISE_EVENT_QUOTEoneRISE_EVENT_QUOTE: RISE_EVENT_QUOTE$ctx.identity.claims.subRISE_EVENT_QUOTE,RISE_EVENT_QUOTEtwoRISE_EVENT_QUOTE: RISE_EVENT_QUOTE$ctx.args.input.inputRISE_EVENT_QUOTE,RISE_EVENT_QUOTEthreeRISE_EVENT_QUOTE: RISE_EVENT_QUOTE$ctx.stash.dbresult.dbvalueRISE_EVENT_QUOTE}"'
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
