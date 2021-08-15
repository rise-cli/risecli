type StackStatus =
    | 'CREATE_IN_PROGRESS'
    | 'CREATE_FAILED'
    | 'CREATE_COMPLETE'
    | 'ROLLBACK_IN_PROGRESS'
    | 'ROLLBACK_FAILED'
    | 'ROLLBACK_COMPLETE'
    | 'DELETE_IN_PROGRESS'
    | 'DELETE_FAILED'
    | 'DELETE_COMPLETE'
    | 'UPDATE_IN_PROGRESS'
    | 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS'
    | 'UPDATE_COMPLETE'
    | 'UPDATE_ROLLBACK_IN_PROGRESS'
    | 'UPDATE_ROLLBACK_FAILED'
    | 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS'
    | 'UPDATE_ROLLBACK_COMPLETE'
    | 'REVIEW_IN_PROGRESS'
    | 'IMPORT_IN_PROGRESS'
    | 'IMPORT_COMPLETE'
    | 'IMPORT_ROLLBACK_IN_PROGRESS'
    | 'IMPORT_ROLLBACK_FAILED'
    | 'IMPORT_ROLLBACK_COMPLETE'

type Input = {
    io: {
        getInfo: any
    }
    config: {
        stackName: string
        minRetryInterval: number
        maxRetryInterval: number
        backoffRate: number
        maxRetries: number
    }
}

type Output = {
    status: string
    message: string
}

/**
 * Get Cloudformation stack info and outputs
 */
async function getCloudFormationStackInfo(getInfo: any) {
    const data = await getInfo()
    const status = data.StackStatus
    const message = data.StackStatusReason
    const outputs = data.Outputs
    return {
        status,
        message,
        outputs
    }
}

// @ts-ignore
async function checkAgainState(
    io: any,
    config: any,
    timer: number,
    times: number
) {
    /**
     * Wait based on timer passed in to the function
     */
    const wait = (time: number): Promise<void> =>
        new Promise((r) => setTimeout(() => r(), time))

    await wait(timer)

    /**
     * Create increased timer for the next call
     */
    const increasedTimer = timer * config.backoffRate
    const newTimer =
        increasedTimer > config.maxRetryInterval
            ? config.maxRetryInterval
            : increasedTimer

    return await recursiveCheck(io, config, times + 1, newTimer)
}

// @ts-ignore
async function recursiveCheck(
    io: any,
    config: any,
    times: number,
    timer: number
) {
    let stackInfo = {
        status: ''
    }
    try {
        stackInfo = await getCloudFormationStackInfo(io.getInfo)
    } catch (e) {
        if (times > 1 && e.message.includes('does not exist')) {
            return {
                status: 'success',
                message: 'Your app was successfully removed'
            }
        }

        if (times === 1 && e.message.includes('does not exist')) {
            return {
                status: 'does not exist',
                message: 'You app does not exist in this AWS account'
            }
        }
    }

    if (times === config.maxRetries) {
        return {
            status: 'still deleting',
            message: 'You app is still deleting'
        }
    }

    if (stackInfo.status.includes('PROGRESS')) {
        return await checkAgainState(io, config, timer, times)
    }

    if (stackInfo.status.includes('FAIL')) {
        return {
            status: 'fail',
            message: 'Failed to remove app'
        }
    }

    return {
        status: 'fail',
        message: 'Cloudformation is in an unknown state'
    }
}

export async function getRemoveStatus(props: Input): Promise<Output> {
    return recursiveCheck(
        props.io,
        props.config,
        1,
        props.config.minRetryInterval
    )
}
