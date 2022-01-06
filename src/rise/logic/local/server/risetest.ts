import { getBlock as getRiseBlock } from '../../getBlock/index'
import { getFile, getJsFile, getDirectories } from '../../../io/filesystem'
const { graphql } = require('graphql')
const setupDb = require('../actions/db/index')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const { handler } = require('./_index')

const db = setupDb()
const riseEvents = setupDb()

const riseUsers = setupDb()
const cognito = {
    adminCreateUser: (x: any) => {
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
    adminDeleteUser: (x: any) => {
        return {
            promise: () => {
                const emailFormatted = x.Username.replace('.', '_dot_')

                riseUsers.remove({
                    pk: emailFormatted,
                    sk: 'user'
                })
            }
        }
    },
    adminGetUser: (x: any) => {
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

type RiseInput = {
    query: any
    identity: any
    env: any
}

// @ts-ignore
global.riseDb = db

// @ts-ignore
global.riseEvents = riseEvents

// @ts-ignore
global.riseUsers = riseUsers

// @ts-ignore
global.riseDefinition = undefined

const riseApp = async ({ query, identity = {}, env = {} }: RiseInput) => {
    Object.keys(env).forEach((k) => {
        process.env[k] = env[k]
    })

    if (!identity.sub) {
        identity.sub = false
    }

    if (!identity.id) {
        identity.id = false
    }
    if (!identity.email) {
        identity.email = false
    }
    if (!identity.ip) {
        identity.ip = false
    }
    const makeRiseApp = async (db: any, events: any, cognito: any) => {
        try {
            // @ts-ignore
            if (!global.riseDefinition) {
                const getBlock = async () => {
                    // const fs = require('fs')
                    // const { readFile } = require('fs-extra')
                    //const getBlock = require('../rise/cliUtils/getBlock')
                    // const io = {
                    //     require: (p: any) => require(process.cwd() + '/' + p),
                    //     fs: fs,
                    //     rootPath: process.cwd() + '/',
                    //     readFile
                    // }

                    return await getRiseBlock({
                        io: {
                            getFile,
                            getJsFile,
                            getDirectories
                        },
                        path: process.cwd(),
                        flags: {
                            stage: 'EMPTY',
                            region: 'EMPTY',
                            profile: 'EMPTY'
                        }
                    })
                }

                const block = await getBlock()
                const typeDefs = block.schema

                const resolvers = {
                    Query: Object.keys(block.resolvers.Query).reduce(
                        (acc: any, k) => {
                            acc[k] = (_: any, input: any) => {
                                return handler(
                                    db,
                                    events,
                                    cognito,
                                    block.config
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
                                        block.resolvers.Query[k] === 'FUNCTION'
                                            ? {
                                                  type: 'FUNCTION',
                                                  app: 'local',
                                                  stage: 'dev'
                                              }
                                            : block.resolvers.Query[k]
                                })
                            }
                            return acc
                        },
                        {}
                    ),
                    Mutation: Object.keys(block.resolvers.Mutation).reduce(
                        (acc: any, k) => {
                            acc[k] = (_: any, input: any) => {
                                return handler(
                                    db,
                                    events,
                                    cognito,
                                    block.config
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
                                        block.resolvers.Mutation[k] ===
                                        'FUNCTION'
                                            ? {
                                                  type: 'FUNCTION',
                                                  app: 'local',
                                                  stage: 'dev'
                                              }
                                            : block.resolvers.Mutation[k]
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

                // @ts-ignore
                global.riseDefinition = schemaexec
            }

            // @ts-ignore
            return global.riseDefinition //schemaexec
        } catch (e) {
            console.log('err: ', e)
        }
    }

    const schemaexec = await makeRiseApp(
        // @ts-ignore
        global.riseDb,
        // @ts-ignore
        global.riseEvents,
        cognito
    )

    const x = await graphql(schemaexec, query)
    if (!x.errors || x.errors.length === 0) {
        return x.data
    } else {
        return x.errors
    }
}

module.exports.runRiseApp = riseApp
