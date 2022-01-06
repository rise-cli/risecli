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

import riseAppUtils from 'riseapp-utils'
import { uploadLambda } from '../logic/uploadLambda'

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
         * Handle Functions
         */

        const uploadInputs = {
            io: {
                getDirectories: riseAppUtils.io.fileSystem.getDirectories,
                getJsFile: riseAppUtils.io.fileSystem.getJsFile,
                makeFolders: riseAppUtils.io.package.makeFolders,
                packageCode: riseAppUtils.io.package.packageCode,
                uploadToS3: riseAppUtils.io.s3.uploadToS3(AWS)
            },
            block: block,
            projectFolderPath: process.cwd()
        }

        const bucketArn = await uploadLambda(uploadInputs)

        /**
         * 3. Create Cloudformation template from
         * Rise Block definition
         */
        const unformattedTemplate = createTemplate(block, bucketArn)

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
        //return

        // console.log(
        //     'L',
        //     template.yml
        //         .replace(/  /g, ' ')
        //         .replace(/  /g, ' ')
        //         .replace(/  /g, ' ')
        //         .replace(/  /g, ' ')
        //         .replace(/  /g, ' ').length
        // )
        // return

        console.log(
            '---<<>>> ',
            template.yml
                .replace(/  /g, ' ')
                .replace(/  /g, ' ')
                .replace(/  /g, ' ')
                .replace(/  /g, ' ')
                .replace(/  /g, ' ')
                .replace(/  /g, ' ')
                .replace(/  /g, ' ')
                .replace(/  /g, ' ')

                .replace(/  /g, ' ').length
        )

        //return
        //return
        // console.log(JSON.stringify(unformattedTemplate, null, 2))
        // return
        // add permissions to fucntion actions

        //    try {
        //        const x = require(process.cwd() + '/functions/' + lambda)
        //        if (x.permissions) {
        //            console.log(x.permissions)
        //        }
        //    } catch (e) {
        //        console.log('..er: ', e)
        //    }
        // Object.keys(block.resolvers.Query || {}).

        // return

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
                .replace(/  /g, ' ')
                .replace(/  /g, ' ')
                .replace(/  /g, ' ')
                .replace(/  /g, ' ')
                .replace(/  /g, ' ')
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
    } catch (e: any) {
        if (e.type === 'validation') {
            console.log(chalk.magenta('Validation:'))
            console.log(e.message)
        } else {
            throw new Error(e)
        }
    }
}
