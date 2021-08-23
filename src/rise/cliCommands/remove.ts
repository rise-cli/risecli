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
         * 1. Get Rise Block definition from file system,
         * validate input and overall structure,
         * and return formatted definition
         */
        const block = await getBlock({
            io: {
                getFile,
                getJsFile,
                getDirectories
            },
            path: process.cwd(),
            flags: input
        })

        /**
         * 2. Get AWS credentials from file
         * system or env variables
         */
        const AWS = await setAWSCredentials({
            io: {
                setConfig,
                setCredentials
            },
            AWS: AWSSDK,
            profile: block.config.profile,
            region: block.config.region
        })

        /**
         * 3. Start CloudFormation stack removal
         */
        ui.default.action.start('Removing Resources (avg. 1 minute)')
        await removeDeployment({
            io: {
                remove: removeStack(AWS)
            },
            name: block.config.name
        })

        /**
         * 4. Check status of removal and return success
         * or fail once operation is done
         */
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
