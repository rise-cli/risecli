import { getBlock } from './index'

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
        }
    }
}

const io = {
    getJsFile: (p: string) => {
        if (p === '/test/rise.js') return mockRiseFile
        if (p === '/test/modules/hats/rise.js') return mockModule1
        if (p === '/test/modules/shoes/rise.js') return mockModule2
    },
    getFile: () => {
        throw new Error('cant find it')
    },
    getDirectories: () => ['hats', 'shoes']
}

test('getBlock will get, format, and validate', () => {
    const result = getBlock({
        io,
        path: '/test',
        flags: {
            region: 'us-east-2',
            stage: 'qa',
            profile: 'blue'
        }
    })

    expect(result).toEqual({
        schema: `type Query {
  hello: String
  hats: String
  shoes: String
}

schema {
  query: Query
}`,
        resolvers: {
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
            Mutation: {},
            Events: {}
        },
        config: {
            name: 'example',
            auth: false,
            profile: 'blue',
            region: 'us-east-2',
            stage: 'qa',
            eventBus: false
        }
    })
})
