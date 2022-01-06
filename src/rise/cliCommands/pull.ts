import * as AWSSDK from 'aws-sdk'
import { getBlock } from '../logic/getBlock/index'
import { getFile, getJsFile, getDirectories, writeFile } from '../io/filesystem'
import { setConfig, setCredentials } from '../io/aws_credentials'
import { setAWSCredentials } from '../logic/setAwsCredentials'
const chalk = require('chalk')
const prettier = require('prettier/standalone')
const parser = require('prettier/parser-babel')

type Input = {
    stage: string
    region: string
    profile: string
    ci: boolean
}

export async function pullCliCommand(input: Input) {
    try {
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

        const cloudformation = new AWS.CloudFormation()
        const getDefinition = async (name: string) => {
            const params = {
                StackName: name
            }

            const x = await cloudformation.getTemplateSummary(params).promise()
            return JSON.parse(x.Metadata)
        }

        const t = await getDefinition(block.config.name)

        const x = {
            schema: `@@BEGIN${t.schema}@@END`,
            resolvers: {
                Query: t.order.Query.reduce((acc: any, x: any) => {
                    acc[x] = t.resolvers.Query[x]

                    return acc
                }, {}),
                Mutation: t.order.Mutation.reduce((acc: any, x: any) => {
                    acc[x] = t.resolvers.Mutation[x]
                    return acc
                }, {})
            },
            config: t.config
        }

        const code = 'module.exports = ' + JSON.stringify(x, null, 2)

        const finalcode = code
            .replace(/\\n/g, '\n        ')
            .replace(
                /"@@BEGIN/g,
                `\`
        `
            )
            .replace(
                /@@END"/g,
                `\`
    `
            )

        const formatted = prettier.format(finalcode, {
            semi: false,
            tabWidth: 4,
            parser: 'babel',
            plugins: [parser]
        })

        writeFile({
            path: process.cwd() + '/latest.js',
            content: formatted
        })
    } catch (e: any) {
        if (e.type === 'validation') {
            console.log(chalk.magenta('Validation:'))
            console.log(e.message)
        } else {
            throw new Error(e)
        }
    }
}
