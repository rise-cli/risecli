import template, { buildPipelines } from './index'

const mockCf = {
    makeSetDbFunction: () => ({
        Resources: {
            DB_SET: true
        }
    }),
    makeDbGetFunction: () => ({
        Resources: {
            DB_GET: true
        }
    }),
    makeQueryDbFunction: () => ({
        Resources: {
            DB_QUERY: true
        }
    }),
    makeRemoveDbFunction: () => ({
        Resources: {
            DB_REMOVE: true
        }
    }),
    makeGuardFunction: (x: any) => ({
        Resources: {
            [`GUARD_${x.field}_${x.index}`]: true
        }
    }),
    makeEmitEvent: (x: any) => ({
        Resources: {
            [`EMIT_${x.name}`]: true
        }
    }),
    makeLambdaEventTrigger: (x: any) => ({
        Resources: {
            [`LAMBDA_${x.eventName}_${x.index}`]: true
        }
    }),
    makeEventRule: (x: any) => ({
        Resources: {
            [`EVENTRULE_${x.eventName}_${x.index}`]: true
        }
    }),
    makeQueryPipeline: (x: any) => ({
        Resources: {
            [`PIPELINEQUERY_${x.field}`]: {
                functions: x.functions,
                add: x.config
            }
        }
    }),
    makeMutationPipeline: (x: any) => ({
        Resources: {
            [`PIPELINEMUTATION_${x.field}`]: {
                functions: x.functions,
                add: x.config
            }
        }
    })
}
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
                    type: 'guard',
                    pk: 'note',
                    sk: 'note'
                },
                {
                    type: 'add',
                    pk: 'note',
                    something: 'note'
                },
                {
                    type: 'db',
                    action: 'get'
                },
                {
                    type: 'db',
                    action: 'list'
                }
            ]
        },
        Mutation: {
            createHello: [
                {
                    type: 'guard',
                    pk: 'note',
                    sk: 'note'
                },
                {
                    type: 'add',
                    pk: 'note',
                    something: 'note'
                },
                {
                    type: 'db',
                    action: 'set'
                },
                {
                    type: 'db',
                    action: 'remove'
                },
                {
                    type: 'db',
                    action: 'get'
                },
                {
                    type: 'db',
                    action: 'list'
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
        },
        Events: {
            processCompleted: [
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
        name: 'example',
        eventBus: 'eventBus'
    }
}

test('buildPipelines will render', () => {
    const result = buildPipelines(mockCf, mockRiseFile)

    expect(result).toEqual({
        Resources: {
            GUARD_hello_a: true,
            DB_GET: true,
            DB_QUERY: true,
            PIPELINEQUERY_hello: {
                functions: [
                    'FunctionGaurdhelloa',
                    'FunctionGet',
                    'FunctionQuery'
                ],
                add: {
                    pk: 'note',
                    something: 'note'
                }
            },
            GUARD_createHello_a: true,
            DB_SET: true,
            DB_REMOVE: true,
            EMIT_createHellog: true,
            PIPELINEMUTATION_createHello: {
                functions: [
                    'FunctionGaurdcreateHelloa',
                    'FunctionSet',
                    'FunctionRemove',
                    'FunctionGet',
                    'FunctionQuery',
                    'FunctionEmitcreateHellog'
                ],
                add: {
                    pk: 'note',
                    something: 'note'
                }
            },
            LAMBDA_processCompleted_a: true,
            EVENTRULE_processCompleted_a: true
        },
        Outputs: {}
    })
})

test('pipeline template can be built successfully', () => {
    const x = template(mockRiseFile)
    expect(x).toBeTruthy()
})
