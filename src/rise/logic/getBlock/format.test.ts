import { formatRiseBlock } from './format'

const mockRiseFile = {
    schema: `
        type Query {
            hello: String
        }
    `,
    resolvers: {
        Query: {
            hello: [
                {
                    type: 'db',
                    action: 'get'
                }
            ]
        },
        Mutation: {
            createHello: [
                {
                    type: 'db',
                    action: 'set'
                }
            ]
        },
        Events: {
            respondTo: {
                type: 'receive-event'
            }
        }
    },
    config: {
        name: 'example'
    }
}

const mockModule1 = {
    schema: `
        type Query {
            hats: String
        }
    `,
    resolvers: {
        Query: {
            hats: [
                {
                    type: 'db',
                    action: 'get'
                }
            ]
        },
        Mutation: {
            createHat: [
                {
                    type: 'db',
                    action: 'set'
                }
            ]
        }
    }
}

const mockModule2 = {
    schema: `
        type Query {
            shoes: String
        }
    `,
    resolvers: {
        Query: {
            shoes: [
                {
                    type: 'db',
                    action: 'get'
                }
            ]
        },
        Mutation: {
            createShoe: {
                type: 'db',
                action: 'set'
            }
        }
    }
}

test('formatRiseBlock will return 1 combined schema', () => {
    const input = {
        root: mockRiseFile,
        modules: [mockModule1, mockModule2],
        flags: {}
    }

    const result = formatRiseBlock(input)
    const expected = `type Query {
  hello: String
  hats: String
  shoes: String
}

schema {
  query: Query
}`
    expect(result.schema).toBe(expected)
})

test('formatRiseBlock will return combined resolvers', () => {
    const input = {
        root: mockRiseFile,
        modules: [mockModule1, mockModule2],
        flags: {}
    }

    const result = formatRiseBlock(input)

    expect(result.resolvers).toEqual({
        Query: {
            hello: [
                {
                    type: 'db',
                    action: 'get'
                }
            ],
            hats: [
                {
                    type: 'db',
                    action: 'get'
                }
            ],
            shoes: [
                {
                    type: 'db',
                    action: 'get'
                }
            ]
        },
        Mutation: {
            createHello: [
                {
                    type: 'db',
                    action: 'set'
                }
            ],
            createHat: [
                {
                    type: 'db',
                    action: 'set'
                }
            ],
            createShoe: [
                {
                    type: 'db',
                    action: 'set'
                }
            ]
        },
        Events: {
            respondTo: {
                type: 'receive-event'
            }
        }
    })
})
