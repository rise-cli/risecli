import {
    isValidApp,
    validateSchemaMatchesResolvers,
    listResolverHasListSchemaDef,
    confirmAllInputsAreSingleInputVariables,
    checkGuardsWithIdWithoutCognitoSetup,
    checkEventFunctionsAndEventConfig,
    validateEvents
} from './validate_app'

/**
 * isValidApp
 *
 */
test('isValidApp with return true if valid', () => {
    const result = isValidApp({
        schema: `
            type Query {
                hello: String
            }`,
        resolvers: {
            Query: {
                hello: [{ type: 'db', action: 'list' }]
            }
        }
    })

    expect(result).toBe(true)
})

test('isValidApp with throw error if schema is empty', () => {
    const test = () => {
        isValidApp({
            schema: ''
        })
    }

    expect(test).toThrow('You must have GraphQL types defined')
})

test('isValidApp with throw error if there is no Query resolver', () => {
    const test = () => {
        isValidApp({
            schema: `
            type Query {
                hello: String
            }`,
            resolvers: {
                Query: {}
            }
        })
    }

    expect(test).toThrow('You must have at least 1 Query or Mutation defined')
})

/**
 * Schema matches resolvers
 *
 */
test('validateSchemaMatchesResolvers returns true if valid', () => {
    const result = validateSchemaMatchesResolvers({
        schema: `
            type Query {
                hello: String
                hat: String
            }`,
        resolvers: {
            Query: {
                hello: { type: 'db', action: 'get' },
                hat: { type: 'db', action: 'get' }
            }
        }
    })

    expect(result).toBe(true)
})

test('validateSchemaMatchesResolvers with throw error if there is query mismatch', () => {
    const test = () => {
        validateSchemaMatchesResolvers({
            schema: `
            type Query {
                hello: String
                hat: String
            }`,
            resolvers: {
                Query: {
                    hello: { type: 'db', action: 'get' },
                    shoe: { type: 'db', action: 'get' }
                }
            }
        })
    }

    expect(test).toThrow(
        'Queries [hat,shoe] do not match between schema and resolvers'
    )
})

test('validateSchemaMatchesResolvers with throw error if there is mutation mismatch', () => {
    const test = () => {
        validateSchemaMatchesResolvers({
            schema: `
            type Mutation {
                hello: String
                hat: String
            }`,
            resolvers: {
                Mutation: {
                    hello: { type: 'db', action: 'get' },
                    shoe: { type: 'db', action: 'get' }
                }
            }
        })
    }

    expect(test).toThrow(
        'Mutations [hat,shoe] do not match between schema and resolvers'
    )
})

/**
 * List is matched between schema and resolver definitions
 *
 */
test('listResolverHasListSchemaDef will return true when resolvers and schema both return array', () => {
    const result = listResolverHasListSchemaDef({
        schema: `
            type Query {
                hello: [String]
              
            }`,
        resolvers: {
            Query: {
                hello: [{ type: 'db', action: 'list' }]
            }
        }
    })

    expect(result).toBe(true)
})

test('listResolverHasListSchemaDef will error if schema returns list, but resolver does not', () => {
    const test = () => {
        listResolverHasListSchemaDef({
            schema: `
            type Query {
                hello: [String]
              
            }`,
            resolvers: {
                Query: {
                    hello: [{ type: 'db', action: 'get' }]
                }
            }
        })
    }

    expect(test).toThrow(
        'Query.hello schema returns a list, but does not in the resolver'
    )
})

test('listResolverHasListSchemaDef will error if either between schema and resolver, one returns array and the other does not', () => {
    const test = () => {
        listResolverHasListSchemaDef({
            schema: `
            type Query {
                hello: String
              
            }`,
            resolvers: {
                Query: {
                    hello: [{ type: 'db', action: 'list' }]
                }
            }
        })
    }

    expect(test).toThrow(
        'Query.hello resolver returns a list, but does not in the schema'
    )
})

/**
 * confirmAllInputsAreSingleInputVariables
 *
 */
test('confirmAllInputsAreSingleInputVariables will return true when inputs have single inputs', () => {
    const result = confirmAllInputsAreSingleInputVariables({
        schema: `
            type Query {
                hello(input: String): [String]
              
            }`
    })

    expect(result).toBe(true)
})

test('confirmAllInputsAreSingleInputVariables will throw error if there is more than 1 input', () => {
    const test = () => {
        confirmAllInputsAreSingleInputVariables({
            schema: `
            type Query {
                hello(input: String, two: String): [String]
              
            }`
        })
    }

    expect(test).toThrow(
        'Query.hello in schema has multiple inputs. Rise requires you define inputs as an input type like: { getNote(input: MyGetNoteInput): String }'
    )
})

test('confirmAllInputsAreSingleInputVariables will throw error if single input is not called input', () => {
    const test = () => {
        confirmAllInputsAreSingleInputVariables({
            schema: `
            type Query {
                hello(two: String): [String]
              
            }`
        })
    }

    expect(test).toThrow(
        'Query.hello in schema has input defined as something other than "input".  Rise requires you define inputs as an input type like: { getNote(input: MyGetNoteInput): String }'
    )
})

/**
 * checkGuardsWithIdWithoutCognitoSetup
 *
 */
test('checkGuardsWithIdWithoutCognitoSetup will return true if valid', () => {
    const result = checkGuardsWithIdWithoutCognitoSetup({
        schema: `
        type Query {
            get: String
        }
        `,
        resolvers: {
            Query: {
                get: [
                    {
                        type: 'add',
                        pk: '!sub',
                        sk: 'note'
                    }
                ]
            }
        },
        config: {
            auth: true
        }
    })

    expect(result).toBe(true)
})

test('checkGuardsWithIdWithoutCognitoSetup will throw if !sub is used in action but auth is not true', () => {
    const test = () => {
        checkGuardsWithIdWithoutCognitoSetup({
            schema: `
        type Query {
            get: String
        }
        `,
            resolvers: {
                Query: {
                    get: [
                        {
                            type: 'add',
                            pk: '!sub',
                            sk: 'note'
                        }
                    ]
                }
            },
            config: {}
        })
    }

    expect(test).toThrow(
        'You are using the !sub keyword, but do not have config.auth set to true'
    )
})

test('checkGuardsWithIdWithoutCognitoSetup will throw if !email is used in action but auth is not true', () => {
    const test = () => {
        checkGuardsWithIdWithoutCognitoSetup({
            schema: `
        type Query {
            get: String
        }
        `,
            resolvers: {
                Query: {
                    get: [
                        {
                            type: 'add',
                            pk: '!email',
                            sk: 'note'
                        }
                    ]
                }
            },
            config: {}
        })
    }

    expect(test).toThrow(
        'You are using the !email keyword, but do not have config.auth set to true'
    )
})

/**
 * checkEventFunctionsAndEventConfig
 *
 */
test('checkEventFunctionsAndEventConfig will return true if valid', () => {
    const result = checkEventFunctionsAndEventConfig({
        schema: `
        type Query {
            get: String
        }
        `,
        resolvers: {
            Query: {
                get: [
                    {
                        type: 'add',
                        pk: '!sub',
                        sk: 'note'
                    }
                ]
            },
            Events: {
                respondToMyEvent: [
                    {
                        type: 'receive-event',
                        source: 'accounting',
                        event: 'processCompleted',
                        query: `
                        mutation completeProcess($input: CompleteInput) {
                            completeProcess(input: $input)
                        }
                    `,
                        variables: {
                            pk: 'detail.pk',
                            sk: 'detail.sk',
                            status: 'detail.status'
                        }
                    }
                ]
            }
        },
        config: {
            eventBus: true
        }
    })

    expect(result).toBe(true)
})

test('checkEventFunctionsAndEventConfig will throw error if event-receive action is defined and eventBus is not set', () => {
    const test = () => {
        checkEventFunctionsAndEventConfig({
            schema: `
        type Query {
            get: String
        }
        `,
            resolvers: {
                Query: {
                    get: [
                        {
                            type: 'add',
                            pk: '!sub',
                            sk: 'note'
                        }
                    ]
                },
                Events: {
                    respondToMyEvent: [
                        {
                            type: 'receive-event',
                            source: 'accounting',
                            event: 'processCompleted',
                            query: `
                        mutation completeProcess($input: CompleteInput) {
                            completeProcess(input: $input)
                        }
                    `,
                            variables: {
                                pk: 'detail.pk',
                                sk: 'detail.sk',
                                status: 'detail.status'
                            }
                        }
                    ]
                }
            },
            config: {}
        })
    }

    expect(test).toThrow(
        'Cannot use receive-event action without defining config.eventBus'
    )
})

test('checkEventFunctionsAndEventConfig will throw error if event-receive action is defined and eventBus is not set', () => {
    const test = () => {
        checkEventFunctionsAndEventConfig({
            schema: `
        type Query {
            get: String
        }
        `,
            resolvers: {
                Query: {
                    get: [
                        {
                            type: 'add',
                            pk: '!sub',
                            sk: 'note'
                        },
                        {
                            type: 'emit-event',
                            event: 'startProcess',
                            data: {
                                pk: '#pk',
                                sk: '#sk',
                                status: 'starting'
                            }
                        }
                    ]
                }
            },
            config: {}
        })
    }

    expect(test).toThrow(
        'Cannot use emit-event action without defining config.eventBus'
    )
})

/**
 * validateEvents
 *
 */
test('validateEvents will return true if valid', () => {
    const result = validateEvents({
        schema: `
        type Query {
            get: String
        }
        type Mutation {
            completeProcess: String
        }
        `,
        resolvers: {
            Query: {
                get: [
                    {
                        type: 'add',
                        pk: '!sub',
                        sk: 'note'
                    }
                ]
            },
            Mutation: {
                completeProcess: [
                    {
                        type: 'db',
                        action: 'set'
                    }
                ]
            },
            Events: {
                respondToMyEvent: [
                    {
                        type: 'receive-event',
                        source: 'accounting',
                        event: 'processCompleted',
                        query: `
                        mutation completeProcess($input: CompleteInput) {
                            completeProcess(input: $input)
                        }
                    `,
                        variables: {
                            pk: 'detail.pk',
                            sk: 'detail.sk',
                            status: 'detail.status'
                        }
                    }
                ]
            }
        },
        config: {
            eventBus: true
        }
    })

    expect(result).toBe(true)
})

test('validateEvents will throw error if Events resolver has more than 1 action in array', () => {
    const test = () => {
        validateEvents({
            schema: `
        type Query {
            get: String
        }
        type Mutation {
            completeProcess: String
        }
        `,
            resolvers: {
                Query: {
                    get: [
                        {
                            type: 'add',
                            pk: '!sub',
                            sk: 'note'
                        }
                    ]
                },
                Mutation: {
                    completeProcess: [
                        {
                            type: 'db',
                            action: 'set'
                        }
                    ]
                },
                Events: {
                    respondToMyEvent: [
                        {
                            type: 'db',
                            action: 'set'
                        },
                        {
                            type: 'receive-event',
                            source: 'accounting',
                            event: 'processCompleted',
                            query: `
                        mutation completeProcess($input: CompleteInput) {
                            completeProcess(input: $input)
                        }
                    `,
                            variables: {
                                pk: 'detail.pk',
                                sk: 'detail.sk',
                                status: 'detail.status'
                            }
                        }
                    ]
                }
            },
            config: {
                eventBus: true
            }
        })
    }

    expect(test).toThrow(
        'Currently event resolvers can only involve 1 action, receive-event'
    )
})

test('validateEvents will throw error if Events receive-event tries to make a query rather than a mutation call', () => {
    const test = () => {
        validateEvents({
            schema: `
        type Query {
            get: String
        }
        type Mutation {
            completeProcess: String
        }
        `,
            resolvers: {
                Query: {
                    get: [
                        {
                            type: 'add',
                            pk: '!sub',
                            sk: 'note'
                        }
                    ]
                },
                Mutation: {
                    completeProcess: [
                        {
                            type: 'db',
                            action: 'set'
                        }
                    ]
                },
                Events: {
                    respondToMyEvent: [
                        {
                            type: 'receive-event',
                            source: 'accounting',
                            event: 'processCompleted',
                            query: `
                        query get {
                            get
                        }
                    `,
                            variables: {
                                pk: 'detail.pk',
                                sk: 'detail.sk',
                                status: 'detail.status'
                            }
                        }
                    ]
                }
            },
            config: {
                eventBus: true
            }
        })
    }

    expect(test).toThrow('Events.respondToMyEvent query must be a mutation')
})

test('validateEvents will throw error if Events resolver has more than 1 action in array', () => {
    const test = () => {
        validateEvents({
            schema: `
        type Query {
            get: String
        }
        type Mutation {
            finishProcess: String
        }
        `,
            resolvers: {
                Query: {
                    get: [
                        {
                            type: 'add',
                            pk: '!sub',
                            sk: 'note'
                        }
                    ]
                },
                Mutation: {
                    finishProcess: [
                        {
                            type: 'db',
                            action: 'set'
                        }
                    ]
                },
                Events: {
                    respondToMyEvent: [
                        {
                            type: 'receive-event',
                            source: 'accounting',
                            event: 'processCompleted',
                            query: `
                        mutation completeProcess($input: CompleteInput) {
                            completeProcess(input: $input)
                        }
                    `,
                            variables: {
                                pk: 'detail.pk',
                                sk: 'detail.sk',
                                status: 'detail.status'
                            }
                        }
                    ]
                }
            },
            config: {
                eventBus: true
            }
        })
    }

    expect(test).toThrow(
        'Events.respondToMyEvent query must be a mutation that exists in the schema'
    )
})
