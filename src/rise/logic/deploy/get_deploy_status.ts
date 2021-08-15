import { formatCompletedDetails } from './format/format_completed_details'
import { formatProgressDisplay } from './format/format_progress_display'
import { displayProgressDetails } from './display/display_progress_details'
import { displayCompletedDetails } from './display/display_completed_details'
import { displayFailDetails } from './display/display_fail_details'
import { displayStillInProgress } from './display/display_still_in_progress'
import { displayUnknownState } from './display/display_unknown_state'

type Input = {
    io: {
        getInfo: any
        getResources: any
        terminal: {
            write: any
            clear: any
        }
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

/**
 * Display and return:
 * "we checked the max amount of times, and Cloudformation is still deploying"
 */
function stillInProgressState(io: any) {
    displayStillInProgress(io.terminal)
    return {
        status: 'in progress',
        message: 'Cloudformation is still deploying...'
    }
}

/**
 * Display current deploy status of all resources
 * wait some time
 * and check the status again
 */
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
     * Get status of all resources
     */
    const resourceProgress = await io.getResources({}, config.name)

    /**
     * Display status in terminal
     */
    const formattedResourceDetails = formatProgressDisplay(resourceProgress)
    displayProgressDetails(io, formattedResourceDetails)

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

/**
 * Display and return deploy failure message
 */
function failState(io: any, message: string) {
    displayFailDetails(io.terminal, {
        message: message
    })

    return {
        status: 'fail',
        message: message
    }
}

/**
 * Display and return deploy success state
 * and deployed app resource details
 */
function completeState(io: any, config: any, stackInfo: any) {
    const formatted = formatCompletedDetails(stackInfo)
    displayCompletedDetails(io.terminal, {
        ...formatted,
        name: config.stackName
    })
    return {
        status: 'success',
        message: 'success'
    }
}

/**
 * Display and return an unkonwn state
 * this happens if cloudformation returns an unknown or undefined
 * status
 */
function unknownState(io: any) {
    displayUnknownState(io.terminal)
    return {
        status: 'fail',
        message: 'Cloudformation is in an unknown state'
    }
}

// @ts-ignore
async function recursiveCheck(
    io: any,
    config: any,
    times: number,
    timer: number
) {
    const stackInfo = await getCloudFormationStackInfo(io.getInfo)

    if (times === config.maxRetries) {
        return stillInProgressState(io)
    }

    if (stackInfo.status.includes('PROGRESS')) {
        return await checkAgainState(io, config, timer, times)
    }

    if (stackInfo.status.includes('FAIL')) {
        return failState(io, stackInfo.message)
    }

    if (stackInfo.status.includes('COMPLETE')) {
        return completeState(io, config, stackInfo)
    }

    return unknownState(io)
}

export async function getDeployStatus(props: Input): Promise<Output> {
    return recursiveCheck(
        props.io,
        props.config,
        1,
        props.config.minRetryInterval
    )
}
