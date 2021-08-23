import { validateBlockStructure, validateAction } from './validate_input'

/**
 * Validate Block Structure
 *
 */
const validBlock = {
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

test('validateBlockStrucure will return true if valid', () => {
    const result = validateBlockStructure(validBlock, false)
    expect(result).toBeTruthy()
})
test('validateBlockStrucure will throw error if "RISE_" is used', () => {
    const test = () => {
        validateBlockStructure(
            {
                ...validBlock,
                resolvers: {
                    Query: {
                        ['RISE_query']: [
                            {
                                type: 'db',
                                action: 'get'
                            }
                        ]
                    }
                }
            },
            false
        )
    }

    expect(test).toThrow(
        'RISE_ is a reserved string and cannot be used in your rise app definition'
    )

    const test2 = () => {
        validateBlockStructure(
            {
                ...validBlock,
                resolvers: {
                    Query: {
                        hello: [
                            {
                                type: 'add',
                                pk: 'RISE_config'
                            },
                            {
                                type: 'db',
                                action: 'get'
                            }
                        ]
                    }
                }
            },
            false
        )
    }
    expect(test2).toThrow(
        'RISE_ is a reserved string and cannot be used in your rise app definition'
    )
})

test('validateBlockStrucure will throw error if schema is not defined', () => {
    const invalidBlock = {
        ...validBlock,
        schema: undefined
    }

    const test = () => {
        validateBlockStructure(invalidBlock, false)
    }

    expect(test).toThrow('Rise block does have a valid GraphQL schema')
})

test('validateBlockStrucure will throw error if no resolvers are defined', () => {
    const invalidBlock = {
        ...validBlock,
        resolvers: {}
    }

    const test = () => {
        validateBlockStructure(invalidBlock, false)
    }

    expect(test).toThrow('Rise block does not have resolvers defined')
})

test('validateBlockStrucure will throw error if root js file and no config is defined', () => {
    let invalidBlock = {
        schema: validBlock.schema,
        resolvers: validBlock.resolvers
    }

    const test = () => {
        validateBlockStructure(invalidBlock, false)
    }

    expect(test).toThrow(
        'The rise.js file at the root of your project must have config defined'
    )
})

test('validateBlockStrucure will return valid if no config is defined but is module', () => {
    let validModule = {
        schema: validBlock.schema,
        resolvers: validBlock.resolvers
    }

    const result = validateBlockStructure(validModule, true)
    expect(result).toBe(true)
})

test('validateBlockStrucure will throw error if root js file and no name is configured', () => {
    let invalidBlock = {
        schema: validBlock.schema,
        resolvers: validBlock.resolvers,
        config: {
            somethingElse: 234
        }
    }

    const test = () => {
        validateBlockStructure(invalidBlock, false)
    }

    expect(test).toThrow(
        'The rise.js file at the root of your project must have config.name defined'
    )
})

/**
 * Validate Action
 *
 */
test('validateAction will return true for valid action', () => {
    const result = validateAction({
        type: 'db',
        action: 'get'
    })

    expect(result).toBe(true)
})

test('validateAction will throw error on unsupported action type', () => {
    const test = () => {
        validateAction({
            type: 'unsubmitted',
            action: 'get'
        })
    }

    expect(test).toThrow(
        'unsubmitted is not a valid action for Queries or Mutations'
    )
})

test('validateAction will throw error on unsupported action on type.db', () => {
    const test = () => {
        validateAction({
            type: 'db',
            action: 'unsupported'
        })
    }

    expect(test).toThrow(
        'unsupported is not a valid db action. Valid types are: "set", "remove", "get", "list"'
    )
})

test('validateAction will throw error if guard does not include sk', () => {
    const test = () => {
        validateAction({
            type: 'guard',
            pk: 'notes',
            pk2: '1234'
        })
    }

    expect(test).toThrow('guard actions must have sk defined')
})

test('validateAction will throw error if guard does not include pk, pk2, or pk3', () => {
    const test = () => {
        validateAction({
            type: 'guard',
            sk: 'notes',
            sk2: '1234'
        })
    }

    expect(test).toThrow(
        'guard actions must have either pk, pk2, or pk3 defined'
    )
})

test('validateAction will throw error if action has a key value pair, where the value is not a string', () => {
    const test = () => {
        validateAction({
            type: 'add',
            pk: 'notes',
            sk: {
                something: 'else'
            }
        })
    }

    expect(test).toThrow(
        'Action Validation Error: sk on type add must be a string'
    )
})
