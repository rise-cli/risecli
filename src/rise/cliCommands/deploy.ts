import * as AWSSDK from 'aws-sdk'
import { getFile, getJsFile, getDirectories, writeFile } from '../io/filesystem'
import { setConfig, setCredentials } from '../io/aws_credentials'
import {
    createStack,
    updateStack,
    getStackInfo,
    getStackResourceStatus
} from '../io/aws_cloudformation'
import { writeToTerminal, clearTerminal } from '../io/terminal'
import { getBlock } from '../logic/getBlock/index'
import { setAWSCredentials } from '../logic/setAwsCredentials'
import { createTemplate } from '../logic/makeTemplate'
import { writeTemplateFile } from '../logic/writeTemplateFile'
import { startDeployment } from '../logic/deploy/deploy_stack'
import { getDeployStatus } from '../logic/deploy/get_deploy_status'

const ui = require('cli-ux')
const chalk = require('chalk')

type Input = {
    stage: string
    region: string
    profile: string
    ci: boolean
}

export async function deployCliCommand(input: Input) {
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

        const template = createTemplate(block)

        /**
         * Write Template
         */
        const te = writeTemplateFile({
            io: {
                writeFile
            },
            template,
            ci: input.ci || false
        })

        /**
         * Deploy
         */
        ui.default.action.start('Deploying Resources (avg. 1 minute)')

        await startDeployment(
            {
                create: createStack(AWS),
                update: updateStack(AWS)
            },
            block.config.name,
            te
        )

        /**
         * Check Status
         */
        await getDeployStatus({
            io: {
                getInfo: async () => getStackInfo(AWS)(block.config.name),
                getResources: async () =>
                    getStackResourceStatus(AWS)(block.config.name),
                terminal: {
                    write: writeToTerminal,
                    clear: clearTerminal
                }
            },
            config: {
                stackName: block.config.name,
                minRetryInterval: 1000,
                maxRetryInterval: 5000,
                backoffRate: 1.2,
                maxRetries: 50
            }
        })
        ui.default.action.stop()

        return
    } catch (e) {
        if (e.type === 'validation') {
            console.log(chalk.magenta('Validation:'))
            console.log(e.message)
        } else {
            throw new Error(e)
        }
    }
}
