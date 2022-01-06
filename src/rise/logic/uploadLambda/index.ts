import r from 'riseapp-utils'

const AWS = require('aws-sdk')

type Input = {
    io: {
        getDirectories: any
        getJsFile: any
        makeFolders: any
        packageCode: any
        uploadToS3: any
    }
    block: any
    projectFolderPath: string
}

const { readFile } = require('fs-extra')

export async function uploadLambda(props: Input) {
    let functionFolder: any

    try {
        functionFolder = props.io.getDirectories(
            props.projectFolderPath + '/functions'
        )
    } catch (e) {
        return
    }
    let f: any = {}

    // VALIDATION
    Object.keys(props.block.resolvers.Query).forEach((x: any) => {
        props.block.resolvers.Query[x].forEach((x: any) => {
            if (x.type === 'function' && !f[x.name]) {
                if (!x.name.startsWith('arn')) {
                    if (!functionFolder.includes(x.name)) {
                        throw new Error(
                            `${x.name} was defined in your rise app as a function, but is not in the functions folder`
                        )
                    }

                    try {
                        // const file: any = props.io.getJsFile(
                        //     process.cwd() + '/functions/' + x.id + '/index.js'
                        // )
                        // if (
                        //     !file.handler ||
                        //     typeof file.handler !== 'function'
                        // ) {
                        //     throw new Error(
                        //         `functions/${x.id}/index does not export a handler function`
                        //     )
                        // }
                    } catch (e: any) {
                        if (e.message.startsWith('Cannot find module')) {
                            throw new Error(
                                `functions/${x.name} does not have an index.js file`
                            )
                        }
                    }

                    f[x.name] = true
                }
            }
        })
    })

    Object.keys(props.block.resolvers.Mutation).forEach((x: any) => {
        props.block.resolvers.Mutation[x].forEach((x: any) => {
            if (x.type === 'function' && !f[x.name]) {
                if (!x.name.startsWith('arn')) {
                    if (!functionFolder.includes(x.name)) {
                        throw new Error(
                            `${x.name} was defined in your rise app as a function, but is not in the functions folder`
                        )
                    }

                    try {
                        // const file: any = props.io.getJsFile(
                        //     process.cwd() + '/functions/' + x.id + '/index.js'
                        // )
                        // if (
                        //     !file.handler ||
                        //     typeof file.handler !== 'function'
                        // ) {
                        //     throw new Error(
                        //         `functions/${x.id}/index does not export a handler function`
                        //     )
                        // }
                    } catch (e: any) {
                        console.log('!!! ', e)
                        if (e.message.startsWith('Cannot find module')) {
                            throw new Error(
                                `functions/${x.name} does not have an index.js file`
                            )
                        }
                    }

                    f[x.name] = true
                }
            }
        })
    })

    // UPLOAD
    let bucketArn
    for (const lambda of Object.keys(f)) {
        props.io.makeFolders({
            start: process.cwd(),
            folders: ['.rise', 'functions', lambda]
        })

        props.io.packageCode({
            location: process.cwd() + '/functions/' + lambda,
            target: process.cwd() + '/.rise/functions/' + lambda,
            name: 'lambda'
        })

        await new Promise((resolve) => setTimeout(resolve, 100))
        //const fs = require('fs')

        // console.log(
        //     'filepath: ',
        //     process.cwd() + '/.rise/functions/' + lambda + '/lambda.zip'
        // )
        const file = await readFile(
            process.cwd() + '/.rise/functions/' + lambda + '/lambda.zip'
        )

        console.log('SIZE: ', file.byteLength)

        // const fileStream = fs.createReadStream(
        //     process.cwd() + '/.rise/functions/' + lambda + '/lambda.zip'
        // )

        // const fillle = await readd(
        //     process.cwd() + '/.rise/functions/' + lambda + '/lambda.zip'
        // )

        const bucketName =
            'rise-' + props.block.config.name + '-' + props.block.config.stage
        // console.log('THE FILE: ', Object.keys(file))

        // r.io.fileSystem.writeFile({
        //     path: './file.zip',
        //     // @ts-ignore
        //     content: fillle
        // })

        await props.io.uploadToS3({
            file: file,
            bucket: bucketName.replace('_', '-'),
            key: 'functions/' + lambda + '/lambda.zip',
            region: props.block.config.region
        })

        if (!bucketArn) {
            bucketArn = 'arn:aws:s3:::' + bucketName.replace('_', '-')
        }

        /**
         *
         */
        const updateLambda = async ({
            name,
            bucket,
            bucketFile,
            AWS
        }: {
            name: string
            bucket: string
            bucketFile: string

            AWS: any
        }) => {
            const lambda = new AWS.Lambda()

            const functionCodeParams = {
                FunctionName: name,
                Publish: true,
                S3Bucket: bucket,
                S3Key: bucketFile
            }

            const res = await lambda
                .updateFunctionCode(functionCodeParams)
                .promise()
            return res.FunctionArn
        }

        const appName = props.block.config.name
        const fName = lambda
        const stage = props.block.config.stage
        try {
            await updateLambda({
                AWS,
                name: `${appName}-${fName}-${stage}`,
                bucket: bucketName.replace('_', '-'),
                bucketFile: 'functions/' + lambda + '/lambda.zip'
            })
        } catch (e: any) {
            if (!e.message.includes('Function not found')) {
                throw new Error(e)
            }
        }
    }

    /**
     * UPLOAD FILES
     */

    const bucketName =
        'rise-' + props.block.config.name + '-' + props.block.config.stage
    const sourceFile = await readFile(process.cwd() + '/rise.js')

    await props.io.uploadToS3({
        file: sourceFile,
        bucket: bucketName.replace('_', '-'),
        key: 'sourceCode/rise.js',
        region: props.block.config.region
    })
    return bucketArn
}
