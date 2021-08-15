import * as AWSSDK from 'aws-sdk'
import { getFile, getJsFile, getDirectories } from '../io/filesystem'
import { removeStack, getStackInfo } from '../io/aws_cloudformation'
import { setConfig, setCredentials } from '../io/aws_credentials'
import { getBlock } from '../logic/getBlock/index'
import { setAWSCredentials } from '../logic/setAwsCredentials'
import { removeDeployment } from '../logic/removeApp/remove_stack'
import { getRemoveStatus } from '../logic/removeApp/get_remove_status'

const ui = require('cli-ux')

type Input = {
    stage: string
    region: string
    profile: string
}

export async function removeCliCommand(input: Input) {
    try {
        /**
         * Prepare Project for deployment
         */
        const block = await getBlock(
            {
                getFile,
                getJsFile,
                getDirectories
            },
            process.cwd(),
            input
        )

        const AWS = await setAWSCredentials({
            io: {
                setConfig,
                setCredentials
            },
            AWS: AWSSDK,
            blockProfile: block.config.profile,
            blockRegion: block.config.region
        })

        ui.default.action.start('Removing Resources (avg. 1 minute)')

        await removeDeployment(
            {
                remove: removeStack(AWS)
            },
            block.config.name
        )

        const removeStatus = await getRemoveStatus({
            io: {
                getInfo: async () => getStackInfo(AWS)(block.config.name)
            },
            config: {
                stackName: block.config.name,
                minRetryInterval: 1000,
                maxRetryInterval: 5000,
                backoffRate: 1.2,
                maxRetries: 20
            }
        })

        if (removeStatus.status === 'fail') {
            throw new Error(removeStatus.message)
        }

        ui.default.action.stop()
    } catch (e) {
        throw new Error(e.message)
    }
}
