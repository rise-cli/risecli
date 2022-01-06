const { GraphQLServer } = require('graphql-yoga')
// get loccation rise local was executed in
// this is wither __dirname, or cwd()
const setupDb = require('../actions/db/index')
const db = setupDb()

const main = async () => {
    try {
        const { handler } = require('./_index')

        const getBlock = async () => {
            const fs = require('fs')
            const { readFile } = require('fs-extra')
            const getBlock = require('../../rise/cliUtils/getBlock')
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
            Query: Object.keys(block.code.Query).reduce((acc, k) => {
                acc[k] = (_, input) => {
                    return handler(db)({
                        ctx: {
                            info: {
                                parentTypeName: 'Query',
                                fieldName: k
                            },
                            arguments: input,
                            identity: {} // TODO sort this out
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
            }, {}),
            Mutation: Object.keys(block.code.Mutation).reduce((acc, k) => {
                acc[k] = (_, input) => {
                    return handler(db)({
                        ctx: {
                            info: {
                                parentTypeName: 'Mutation',
                                fieldName: k
                            },
                            arguments: input,
                            identity: {} // TODO sort this out
                        },
                        action:
                            block.code.Mutation[k] === 'FUNCTION'
                                ? {
                                      type: 'FUNCTION',
                                      app: 'local',
                                      stage: 'dev'
                                  }
                                : block.code.Mutation[k]
                    })
                }
                return acc
            }, {})
        }

        const server = new GraphQLServer({ typeDefs, resolvers })

        server.start(() => console.log('Rise is running on localhost:4000'))
    } catch (e) {
        console.log('err: ', e)
    }
}
main()
