import {
    makeSetDbFunction,
    makeDbGetFunction,
    makeQueryDbFunction,
    makeRemoveDbFunction
} from './action_db'
import { makeGuardFunction } from './action_guard'
import { makeEmitEvent } from './action_emitevent'
import { makeAddUser, makeDeleteUser } from './action_cognito'
import { makeLambda } from './action_lambda'
import { makeAddFunction } from './action_add'
import { makeLambdaEventTrigger } from './lambda_eventtrigger'
import { makeEventRule } from './eventrule_eventtrigger'
import { makeQueryPipeline } from './pipeline_query'
import { makeMutationPipeline } from './pipeline_mutation'

const indexChar = 'abcdefghijklmnopqrstuvwxyz'.split('')

export function buildPipelines(cf: any, rise: any, bucketArn?: string) {
    let res = {}
    Object.keys(rise.resolvers.Query || {}).forEach((k) => {
        const item = rise.resolvers.Query[k]
        if (Array.isArray(item)) {
            let toAdd: any = {}
            let functions: any = []
            item.forEach((x: any, i: number) => {
                // if (x.type === 'add' && i === 0) {
                //     Object.keys(x)
                //         .filter((k) => k !== 'type')
                //         .forEach((k) => (toAdd[k] = x[k]))
                // }
                if (x.type === 'add') {
                    const f = cf.makeAddFunction({
                        name: `${k}${indexChar[i]}`,
                        config: Object.keys(x)
                            .filter((k) => k !== 'type')
                            .reduce((acc: any, k: string) => {
                                acc[k] = x[k]
                                return acc
                            }, {})
                    })
                    res = {
                        ...res,
                        ...f.Resources
                    }

                    functions.push(`FunctionAdd${k}${indexChar[i]}`)
                }

                if (x.type === 'guard') {
                    const f = cf.makeGuardFunction({
                        index: indexChar[i],
                        field: k,
                        config: {
                            pk: x.pk,
                            sk: x.sk
                        }
                    })
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push(`FunctionGaurd${k}${indexChar[i]}`)
                }

                if (x.type === 'function') {
                    const f = cf.makeLambda({
                        appName: rise.config.name,
                        name: x.name,
                        stage: rise.config.stage,
                        bucketArn: bucketArn,
                        dbName: rise.config.name,
                        input: x.input
                    })
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push(`FunctionLambda${x.id}`)
                }

                if (x.type === 'users') {
                    if (x.action === 'add') {
                        const f = cf.makeAddUser({
                            name: x.id,
                            email: x.email
                        })
                        res = {
                            ...res,
                            ...f.Resources
                        }
                        functions.push(`FunctionCognitoAdd`)
                    }

                    if (x.action === 'remove') {
                        const f = cf.makeDeleteUser({
                            name: x.id
                        })
                        res = {
                            ...res,
                            ...f.Resources
                        }
                        functions.push(`FunctionCognitoDelete`)
                    }
                }

                if (x.type === 'db') {
                    if (x.action === 'get') {
                        const f = cf.makeDbGetFunction({
                            name: `${k}${indexChar[i]}`,
                            input: x.input
                        })
                        res = {
                            ...res,
                            ...f.Resources
                        }
                        if (x.input) {
                            functions.push(
                                'FunctionGet' + `${k}${indexChar[i]}`
                            )
                        } else {
                            functions.push('FunctionGet')
                        }
                    }
                    if (x.action === 'list') {
                        const f = cf.makeQueryDbFunction({
                            name: `${k}${indexChar[i]}`,
                            input: x.input
                        })
                        res = {
                            ...res,
                            ...f.Resources
                        }

                        if (x.input) {
                            functions.push(
                                'FunctionQuery' + `${k}${indexChar[i]}`
                            )
                        } else {
                            functions.push('FunctionQuery')
                        }
                    }
                }
            })
            res = {
                ...res,
                ...cf.makeQueryPipeline({
                    field: k,
                    functions: functions,
                    config: toAdd
                }).Resources
            }
        } else {
            res = {
                ...res
                // make step function unit resolver
            }
        }
    })

    Object.keys(rise.resolvers.Mutation || {}).forEach((k) => {
        const item = rise.resolvers.Mutation[k]
        let toAdd: any = {}
        let functions: any = []
        item.forEach((x: any, i: number) => {
            // if (x.type === 'add' && i === 0) {
            //     Object.keys(x)
            //         .filter((k) => k !== 'type')
            //         .forEach((k) => (toAdd[k] = x[k]))
            // }

            if (x.type === 'add') {
                const f = cf.makeAddFunction({
                    name: `${k}${indexChar[i]}`,
                    config: Object.keys(x)
                        .filter((k) => k !== 'type')
                        .reduce((acc: any, k: string) => {
                            acc[k] = x[k]
                            return acc
                        }, {})
                })
                res = {
                    ...res,
                    ...f.Resources
                }

                functions.push(`FunctionAdd${k}${indexChar[i]}`)
            }
            if (x.type === 'guard') {
                const f = cf.makeGuardFunction({
                    index: indexChar[i],
                    field: k,
                    config: {
                        pk: x.pk,
                        sk: x.sk
                    }
                })
                res = {
                    ...res,
                    ...f.Resources
                }
                functions.push(`FunctionGaurd${k}${indexChar[i]}`)
            }

            if (x.type === 'function') {
                const f = cf.makeLambda({
                    appName: rise.config.name,
                    name: x.name,
                    stage: rise.config.stage,
                    bucketArn: bucketArn,
                    dbName: rise.config.name,
                    input: x.input
                })
                res = {
                    ...res,
                    ...f.Resources
                }
                //console.log(JSON.stringify(f.Resources, null, 2))
                functions.push(`FunctionLambda${x.name}`)
            }

            if (x.type === 'users') {
                if (x.action === 'add') {
                    const f = cf.makeAddUser({
                        name: x.id,
                        email: x.email
                    })
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push(`FunctionCognitoAdd`)
                }

                if (x.action === 'remove') {
                    const f = cf.makeDeleteUser({
                        name: x.id
                    })
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push(`FunctionCognitoDelete`)
                }
            }

            if (x.type === 'db') {
                if (x.action === 'get') {
                    const f = cf.makeDbGetFunction({
                        name: `${k}${indexChar[i]}`,
                        input: x.input
                    })
                    res = {
                        ...res,
                        ...f.Resources
                    }

                    if (x.input) {
                        functions.push('FunctionGet' + `${k}${indexChar[i]}`)
                    } else {
                        functions.push('FunctionGet')
                    }
                }
                if (x.action === 'list') {
                    const f = cf.makeQueryDbFunction({
                        name: `${k}${indexChar[i]}`,
                        input: x.input
                    })
                    res = {
                        ...res,
                        ...f.Resources
                    }

                    if (x.input) {
                        functions.push('FunctionQuery' + `${k}${indexChar[i]}`)
                    } else {
                        functions.push('FunctionQuery')
                    }
                }
                if (x.action === 'set') {
                    const f = cf.makeSetDbFunction({
                        name: `${k}${indexChar[i]}`,
                        input: x.input
                    })
                    res = {
                        ...res,
                        ...f.Resources
                    }

                    if (x.input) {
                        functions.push('FunctionSet' + `${k}${indexChar[i]}`)
                    } else {
                        functions.push('FunctionSet')
                    }
                }
                if (x.action === 'remove') {
                    const f = cf.makeRemoveDbFunction({
                        name: `${k}${indexChar[i]}`,
                        input: x.input
                    })
                    res = {
                        ...res,
                        ...f.Resources
                    }

                    if (x.input) {
                        functions.push('FunctionRemove' + `${k}${indexChar[i]}`)
                    } else {
                        functions.push('FunctionRemove')
                    }
                }
            }

            if (x.type === 'emit-event') {
                const f = cf.makeEmitEvent({
                    name: `${k}${indexChar[i]}`,
                    config: {
                        eventBus: rise.config.eventBus || 'default',
                        source: rise.config.name,
                        event: x.event,
                        detail: x.input
                    }
                })
                res = {
                    ...res,
                    ...f.Resources
                }
                functions.push(`FunctionEmit${k}${indexChar[i]}`)
            }
        })
        res = {
            ...res,
            ...cf.makeMutationPipeline({
                field: k,
                functions: functions,
                config: toAdd
            }).Resources
        }
    })

    Object.keys(rise.resolvers.Events || {}).forEach((k) => {
        const item = rise.resolvers.Events[k]
        item.forEach((x: any, i: number) => {
            if (x.type === 'receive-event') {
                const lambdaFunction = cf.makeLambdaEventTrigger({
                    key: k,
                    apiName: rise.config.name,
                    index: indexChar[i],
                    eventName: x.event,
                    query: x.query,
                    eventInput: x.variables
                })
                const eventRule = cf.makeEventRule({
                    key: k,
                    apiName: rise.config.name,
                    eventBus: rise.config.eventBus,
                    eventSource: x.source,
                    eventName: x.event,
                    index: indexChar[i]
                })
                res = {
                    ...res,
                    ...lambdaFunction.Resources,
                    ...eventRule.Resources
                }
            }
        })
    })
    return {
        Resources: res,
        Outputs: {}
    }
}

export default (rise: any, bucketArn?: string) => {
    const cf = {
        makeSetDbFunction,
        makeDbGetFunction,
        makeQueryDbFunction,
        makeRemoveDbFunction,
        makeGuardFunction,
        makeLambda,
        makeEmitEvent,
        makeLambdaEventTrigger,
        makeEventRule,
        makeQueryPipeline,
        makeMutationPipeline,
        makeAddUser,
        makeAddFunction,
        makeDeleteUser
    }

    return buildPipelines(cf, rise, bucketArn)
}
