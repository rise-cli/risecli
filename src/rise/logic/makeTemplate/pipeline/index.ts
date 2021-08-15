import {
    makeSetDbFunction,
    makeDbGetFunction,
    makeQueryDbFunction,
    makeRemoveDbFunction
} from './action_db'
import { makeGuardFunction } from './action_guard'
import { makeEmitEvent } from './action_emitevent'
import { makeLambdaEventTrigger } from './lambda_eventtrigger'
import { makeEventRule } from './eventrule_eventtrigger'
import { makeQueryPipeline } from './pipeline_query'
import { makeMutationPipeline } from './pipeline_mutation'

const indexChar = 'abcdefghijklmnopqrstuvwxyz'.split('')

export function buildPipelines(cf: any, rise: any) {
    let res = {}
    Object.keys(rise.resolvers.Query || {}).forEach((k) => {
        const item = rise.resolvers.Query[k]
        let toAdd: any = {}
        let functions: any = []
        item.forEach((x: any, i: number) => {
            if (x.type === 'add') {
                Object.keys(x)
                    .filter((k) => k !== 'type')
                    .forEach((k) => (toAdd[k] = x[k]))
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
            if (x.type === 'db') {
                if (x.action === 'get') {
                    const f = cf.makeDbGetFunction()
                    res = {
                        ...res,
                        ...f.Resources
                    }

                    functions.push('FunctionGet')
                }
                if (x.action === 'list') {
                    const f = cf.makeQueryDbFunction()
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push('FunctionQuery')
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
    })

    Object.keys(rise.resolvers.Mutation || {}).forEach((k) => {
        const item = rise.resolvers.Mutation[k]
        let toAdd: any = {}
        let functions: any = []
        item.forEach((x: any, i: number) => {
            if (x.type === 'add') {
                Object.keys(x)
                    .filter((k) => k !== 'type')
                    .forEach((k) => (toAdd[k] = x[k]))
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
            if (x.type === 'db') {
                if (x.action === 'get') {
                    const f = cf.makeDbGetFunction()
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push('FunctionGet')
                }
                if (x.action === 'list') {
                    const f = cf.makeQueryDbFunction()
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push('FunctionQuery')
                }
                if (x.action === 'set') {
                    const f = cf.makeSetDbFunction()
                    res = {
                        ...res,
                        ...f.Resources
                    }

                    functions.push('FunctionSet')
                }
                if (x.action === 'remove') {
                    const f = cf.makeRemoveDbFunction()
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push('FunctionRemove')
                }
            }

            if (x.type === 'emit-event') {
                const f = cf.makeEmitEvent({
                    name: `${k}${indexChar[i]}`,
                    config: {
                        eventBus: rise.config.eventBus || 'default',
                        source: rise.config.name,
                        event: x.event,
                        detail: x.data
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
                    apiName: rise.config.name,
                    index: indexChar[i],
                    eventName: x.event,
                    query: x.query,
                    eventInput: x.variables
                })
                const eventRule = cf.makeEventRule({
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

export default (rise: any) => {
    const cf = {
        makeSetDbFunction,
        makeDbGetFunction,
        makeQueryDbFunction,
        makeRemoveDbFunction,
        makeGuardFunction,
        makeEmitEvent,
        makeLambdaEventTrigger,
        makeEventRule,
        makeQueryPipeline,
        makeMutationPipeline
    }

    return buildPipelines(cf, rise)
}
