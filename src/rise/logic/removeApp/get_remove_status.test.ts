import { getRemoveStatus } from './get_remove_status'

const deleteFailResponse = {
    StackStatus: 'DELETE_FAILED',
    StackStatusReason: 'failed',
    Outputs: []
}

const deleteInProgressResponse = {
    StackStatus: 'DELETING_IN_PROGRESS',
    StackStatusReason: 'in progress',
    Outputs: []
}

const unknownResponse = {
    StackStatus: 'CREATE_UNKNOWN',
    StackStatusReason: 'unknown',
    Outputs: []
}

test('getRemoveStatus will return app does not exist if it cant find on first try', async () => {
    const input = {
        io: {
            getInfo: () => {
                throw new Error('does not exist')
            }
        },
        config: {
            stackName: 'my-stack',
            minRetryInterval: 1,
            maxRetryInterval: 1,
            backoffRate: 1,
            maxRetries: 100
        }
    }

    const result = await getRemoveStatus(input)
    expect(result.status).toBe('does not exist')
    expect(result.message).toBe('You app does not exist in this AWS account')
})

test('getRemoveStatus will return success if it does not exist one second try', async () => {
    let times = 0

    const input = {
        io: {
            getInfo: () => {
                times++
                if (times <= 1) {
                    return deleteInProgressResponse
                }
                throw new Error('does not exist')
            }
        },
        config: {
            stackName: 'my-stack',
            minRetryInterval: 1,
            maxRetryInterval: 1,
            backoffRate: 1,
            maxRetries: 100
        }
    }

    const result = await getRemoveStatus(input)
    expect(result.status).toBe('success')
    expect(result.message).toBe('Your app was successfully removed')
})

test('getRemoveStatus will return still deleting if max retries have taken place', async () => {
    let times = 0

    const input = {
        io: {
            getInfo: () => {
                times++
                if (times <= 6) {
                    return deleteInProgressResponse
                }
                throw new Error('does not exist')
            }
        },
        config: {
            stackName: 'my-stack',
            minRetryInterval: 1,
            maxRetryInterval: 1,
            backoffRate: 1,
            maxRetries: 4
        }
    }

    const result = await getRemoveStatus(input)
    expect(result.status).toBe('still deleting')
    expect(result.message).toBe('You app is still deleting')
})

test('getRemoveStatus will return fail if deletion failed', async () => {
    let times = 0

    const input = {
        io: {
            getInfo: () => {
                times++
                if (times <= 2) {
                    return deleteInProgressResponse
                }
                return deleteFailResponse
            }
        },
        config: {
            stackName: 'my-stack',
            minRetryInterval: 1,
            maxRetryInterval: 1,
            backoffRate: 1,
            maxRetries: 4
        }
    }

    const result = await getRemoveStatus(input)
    expect(result.status).toBe('fail')
    expect(result.message).toBe('Failed to remove app')
})

test('getRemoveStatus will return fail if unknown response from Cloudformation is given', async () => {
    let times = 0

    const input = {
        io: {
            getInfo: () => {
                times++
                if (times <= 2) {
                    return deleteInProgressResponse
                }
                return unknownResponse
            }
        },
        config: {
            stackName: 'my-stack',
            minRetryInterval: 1,
            maxRetryInterval: 1,
            backoffRate: 1,
            maxRetries: 4
        }
    }

    const result = await getRemoveStatus(input)
    expect(result.status).toBe('fail')
    expect(result.message).toBe('Cloudformation is in an unknown state')
})
