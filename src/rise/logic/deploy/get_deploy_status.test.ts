import { getDeployStatus } from './get_deploy_status'

const createSuccessResponse = {
    StackStatus: 'CREATE_COMPLETE',
    StackStatusReason: 'created',
    Outputs: []
}

const createFailResponse = {
    StackStatus: 'CREATE_FAILED',
    StackStatusReason: 'failed',
    Outputs: []
}

const createInProgressResponse = {
    StackStatus: 'CREATE_IN_PROGRESS',
    StackStatusReason: 'in progress',
    Outputs: []
}

const unknownResponse = {
    StackStatus: 'CREATE_UNKNOWN',
    StackStatusReason: 'unknown',
    Outputs: []
}

const mockResourceResponse = {
    StackResources: [
        {
            LogicalResourceId: 'AppSyncId',
            ResourceStatus: 'UPDATING'
        },
        {
            LogicalResourceId: 'Cognito Pool Client Id',
            ResourceStatus: 'UPDATING'
        },
        {
            LogicalResourceId: 'Db',
            ResourceStatus: 'COMPLETE'
        }
    ]
}

test('getDeployStatus will return success when first call is successfull', async () => {
    const input = {
        io: {
            getInfo: () => {
                return createSuccessResponse
            },
            getResources: () => mockResourceResponse,
            terminal: {
                write: () => {},
                clear: () => {}
            }
        },
        config: {
            stackName: 'my-stack',
            minRetryInterval: 1000,
            maxRetryInterval: 5000,
            backoffRate: 1.1,
            maxRetries: 100
        }
    }

    const result = await getDeployStatus(input)
    expect(result.status).toBe('success')
    expect(result.message).toBe('success')
})

test('getDeployStatus will return fail when first getInfo call is unsuccessful', async () => {
    const input = {
        io: {
            getInfo: () => {
                return createFailResponse
            },
            getResources: () => mockResourceResponse,
            terminal: {
                write: () => {},
                clear: () => {}
            }
        },
        config: {
            stackName: 'my-stack',
            minRetryInterval: 1000,
            maxRetryInterval: 5000,
            backoffRate: 1.1,
            maxRetries: 100
        }
    }

    const result = await getDeployStatus(input)
    expect(result.status).toBe('fail')
    expect(result.message).toBe('failed')
})

test('getDeployStatus can retry and return correctly', async () => {
    let times = 0
    const input = {
        io: {
            getInfo: () => {
                times++
                if (times <= 4) {
                    return createInProgressResponse
                }
                return createSuccessResponse
            },
            getResources: () => mockResourceResponse,
            terminal: {
                write: () => {},
                clear: () => {}
            }
        },
        config: {
            stackName: 'my-stack',
            minRetryInterval: 1,
            maxRetryInterval: 1,
            backoffRate: 1,
            maxRetries: 6
        }
    }

    const result = await getDeployStatus(input)
    expect(times).toBe(5)
    expect(result.status).toBe('success')
    expect(result.message).toBe('success')
})

test('getDeployStatus will return still deploying if max retries have happened', async () => {
    let times = 0
    const input = {
        io: {
            getInfo: () => {
                times++
                if (times <= 4) {
                    return createInProgressResponse
                }
                return createSuccessResponse
            },
            getResources: () => mockResourceResponse,
            terminal: {
                write: () => {},
                clear: () => {}
            }
        },
        config: {
            stackName: 'my-stack',
            minRetryInterval: 1,
            maxRetryInterval: 1,
            backoffRate: 1,
            maxRetries: 2
        }
    }

    const result = await getDeployStatus(input)
    expect(times).toBe(2)
    expect(result.status).toBe('in progress')
    expect(result.message).toBe('Cloudformation is still deploying...')
})

test('getDeployStatus will return unknown state if cloudformation returns an unknown state', async () => {
    let times = 0
    const input = {
        io: {
            getInfo: () => {
                times++
                if (times <= 4) {
                    return createInProgressResponse
                }
                return unknownResponse
            },
            getResources: () => mockResourceResponse,
            terminal: {
                write: () => {},
                clear: () => {}
            }
        },
        config: {
            stackName: 'my-stack',
            minRetryInterval: 1,
            maxRetryInterval: 1,
            backoffRate: 1,
            maxRetries: 6
        }
    }

    const result = await getDeployStatus(input)
    expect(times).toBe(5)
    expect(result.status).toBe('fail')
    expect(result.message).toBe('Cloudformation is in an unknown state')
})
