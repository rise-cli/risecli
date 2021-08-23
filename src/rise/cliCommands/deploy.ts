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
         * 3. Create Cloudformation template from
         * Rise Block definition
         */
        const unformattedTemplate = createTemplate(block)

        /**
         * 4. Write CloudFormation template to project
         */
        const template = writeTemplateFile({
            io: {
                writeFile
            },
            template: unformattedTemplate,
            ci: input.ci || false
        })

        /**
         * 5. Start CloudFormation deployment
         */
        ui.default.action.start('Deploying Resources (avg. 1 minute)')

        await startDeployment({
            io: {
                create: createStack(AWS),
                update: updateStack(AWS)
            },
            name: block.config.name,
            template: template.yml
        })

        /**
         * 6. Check status of deployment and return api details
         * once deployment is finished
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
