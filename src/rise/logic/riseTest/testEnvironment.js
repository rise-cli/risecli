const NodeEnvironment = require('jest-environment-node')
const { graphql } = require('graphql')
const { handler } = require('../local/server/_index')

const { makeExecutableSchema } = require('@graphql-tools/schema')
const setupDb = require('../local/actions/db/index')

class CustomEnvironment extends NodeEnvironment {
    constructor(config, context) {
        super(config, context)
        this.testPath = context.testPath
        this.docblockPragmas = context.docblockPragmas
    }

    async setup() {
        await super.setup()

        const db = setupDb()

        const riseUsers = setupDb()
        const cognito = {
            adminCreateUser: (x) => {
                return {
                    promise: () => {
                        const emailFormatted = x.Username.replace('.', '_dot_')

                        riseUsers.set({
                            pk: emailFormatted,
                            sk: 'user',
                            pass: x.TemporaryPassword,
                            UserStatus: 'FORCE_CHANGE_PASSWORD'
                        })

                        // console.log('++ ', riseUsers.getCurrentState())
                    }
                }
            },
            adminDeleteUser: (x) => {
                return {
                    promise: () => {
                        const emailFormatted = x.Username.replace('.', '_dot_')
                        console.log('RemOFE UESR ', emailFormatted)

                        riseUsers.remove({
                            pk: emailFormatted,
                            sk: 'user'
                        })
                    }
                }
            },
            adminGetUser: (x) => {
                return {
                    promise: () => {
                        const emailFormatted = x.Username.replace('.', '_dot_')

                        riseUsers.get({
                            pk: emailFormatted,
                            sk: 'user'
                        })
                    }
                }
            }
        }

        this.global.runRiseApp = async ({ query, identity = {}, env = {} }) => {
            Object.keys(env).forEach((k) => {
                process.env[k] = env[k]
            })

            if (!identity.id) {
                identity.id = false
            }
            if (!identity.email) {
                identity.email = false
            }
            if (!identity.ip) {
                identity.ip = false
            }
            const makeRiseApp = async (db, cognito) => {
                try {
                    const getBlock = async () => {
                        const fs = require('fs')
                        const { readFile } = require('fs-extra')
                        const getBlock = require('../rise/cliUtils/getBlock')
                        const io = {
                            require: (p) => require(process.cwd() + '/' + p),
                            fs: fs,
                            rootPath: process.cwd() + '/',
                            readFile
                        }

                        return await getBlock(io)
                    }

                    const block = await getBlock()
                    const typeDefs = block.api

                    const resolvers = {
                        Query: Object.keys(block.code.Query).reduce(
                            (acc, k) => {
                                acc[k] = (_, input) => {
                                    return handler(
                                        db,
                                        cognito
                                    )({
                                        ctx: {
                                            info: {
                                                parentTypeName: 'Query',
                                                fieldName: k
                                            },
                                            arguments: input,
                                            identity: identity
                                        },
                                        action:
                                            block.code.Query[k] === 'FUNCTION'
                                                ? {
                                                      type: 'FUNCTION',
                                                      app: 'local',
                                                      stage: 'dev'
                                                  }
                                                : block.code.Query[k]
                                    })
                                }
                                return acc
                            },
                            {}
                        ),
                        Mutation: Object.keys(block.code.Mutation).reduce(
                            (acc, k) => {
                                acc[k] = (_, input) => {
                                    return handler(
                                        db,
                                        cognito
                                    )({
                                        ctx: {
                                            info: {
                                                parentTypeName: 'Mutation',
                                                fieldName: k
                                            },
                                            arguments: input,
                                            identity: identity
                                        },
                                        action:
                                            block.code.Mutation[k] ===
                                            'FUNCTION'
                                                ? {
                                                      type: 'FUNCTION',
                                                      app: 'local',
                                                      stage: 'dev'
                                                  }
                                                : block.code.Mutation[k]
                                    })
                                }
                                return acc
                            },
                            {}
                        )
                    }

                    const schemaexec = makeExecutableSchema({
                        typeDefs,
                        resolvers
                    })

                    return schemaexec
                } catch (e) {
                    console.log('err: ', e)
                }
            }
            const schemaexec = await makeRiseApp(db, cognito)

            const x = await graphql(schemaexec, query)
            return x.data
        }

        this.global.riseDb = db
        this.global.riseUsers = riseUsers

        // Will trigger if docblock contains @my-custom-pragma my-pragma-value
        if (this.docblockPragmas['my-custom-pragma'] === 'my-pragma-value') {
            // ...
        }
    }

    async teardown() {
        this.global.riseDb.reset()
        await super.teardown()
    }

    runScript(script) {
        return super.runScript(script)
    }

    async handleTestEvent(event, state) {
        if (event.name === 'test_start') {
            // ...
        }
    }
}

module.exports = CustomEnvironment
