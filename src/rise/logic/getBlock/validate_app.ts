import { ValidationError } from '../../utils/errors'
import gql from 'graphql-tag'

/**
 * Utils
 *
 */
function arr_diff(a1: any, a2: any) {
    const a = []
    const diff = []

    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true
    }

    for (var i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]]
        } else {
            a[a2[i]] = true
        }
    }

    for (var k in a) {
        diff.push(k)
    }

    return diff
}

/**
 * Validation
 *
 */
export function isValidApp(block: any) {
    if (block.schema.trim().length === 0) {
        throw new ValidationError('You must have GraphQL types defined')
    }

    const queries = Object.keys(block.resolvers.Query)

    if (queries.length === 0) {
        throw new ValidationError(
            'You must have at least 1 Query or Mutation defined'
        )
    }

    return true
}

export function validateSchemaMatchesResolvers(block: any) {
    const xx = gql(`${block.schema}`)

    const getResolver = (r: string) => {
        return (
            xx.definitions.filter(
                (x: any) => x.name && x.name.value === r
            )[0] || false
        )
    }

    const getResolverValues = (r: any) => {
        if (!r) return []
        return r.fields.map((x: any) => x.name && x.name.value)
    }

    const q = getResolver('Query')
    const queries = getResolverValues(q)
    const qInvalid = arr_diff(queries, Object.keys(block.resolvers.Query || {}))

    const m = getResolver('Mutation')
    const mutations = getResolverValues(m)
    const mInvalid = arr_diff(
        mutations,
        Object.keys(block.resolvers.Mutation || {})
    )

    const s = getResolver('Subscriptions')
    const subscriptions = getResolverValues(s)
    const sInvalid = arr_diff(
        subscriptions,
        Object.keys(block.resolvers.Subscription || {})
    )

    if (qInvalid.length > 0)
        throw new ValidationError(
            `Queries [${qInvalid}] do not match between schema and resolvers`
        )
    if (mInvalid.length > 0)
        throw new ValidationError(
            `Mutations [${mInvalid}] do not match between schema and resolvers`
        )
    if (sInvalid.length > 0)
        throw new ValidationError(
            `Subscriptions [${sInvalid}] do not match between schema and resolvers`
        )

    return true
}

export function listResolverHasListSchemaDef(block: any) {
    const xx = gql(`${block.schema}`)
    const getResolver = (r: string) => {
        return (
            xx.definitions.filter(
                (x: any) => x.name && x.name.value === r
            )[0] || false
        )
    }

    const determineListTypes = (t: string) => {
        const q: any = getResolver(t)
        const types = q.fields.map((x: any) => ({
            key: x.name.value,
            type: x.type.kind === 'ListType' ? 'list' : 'get'
        }))

        types.forEach((x: any) => {
            // @ts-ignore
            const r = block.resolvers[t][x.key]
            let lastDb: string | boolean = false
            r.forEach((action: any) => {
                if (action.type === 'db') {
                    lastDb = action.action
                }
            })
            if (lastDb) {
                if (x.type === 'list' && lastDb !== 'list') {
                    throw new ValidationError(
                        `${t}.${x.key} schema returns a list, but does not in the resolver`
                    )
                }
                if (x.type !== 'list' && lastDb === 'list') {
                    throw new ValidationError(
                        `${t}.${x.key} resolver returns a list, but does not in the schema`
                    )
                }
            }
        })
    }

    determineListTypes('Query')
    return true
}

export function confirmAllInputsAreSingleInputVariables(block: any) {
    const xx = gql(`${block.schema}`)
    const getResolver = (r: string) => {
        return (
            xx.definitions.filter(
                (x: any) => x.name && x.name.value === r
            )[0] || false
        )
    }

    const determineListTypes = (t: string) => {
        const q: any = getResolver(t)

        q.fields.forEach((x: any) => {
            if (x.arguments.length > 0) {
                if (x.arguments.length > 1) {
                    throw new ValidationError(
                        `${t}.${x.name.value} in schema has multiple inputs. Rise requires you define inputs as an input type like: { getNote(input: MyGetNoteInput): String }`
                    )
                }

                if (x.arguments[0].name.value !== 'input') {
                    throw new ValidationError(
                        `${t}.${x.name.value} in schema has input defined as something other than "input".  Rise requires you define inputs as an input type like: { getNote(input: MyGetNoteInput): String }`
                    )
                }
            }
        })
    }

    determineListTypes('Query')
    return true
}

export function checkGuardsWithIdWithoutCognitoSetup(block: any) {
    if (block.config.auth) {
        return true
    }
    const q = block.resolvers.Query || {}
    const q2 = Object.keys(q)
        .map((k) => q[k] || [])
        // @ts-ignore
        .flat()

    const m = block.resolvers.Mutation || {}
    const m2 = Object.keys(m)
        .map((k) => m[k] || [])
        // @ts-ignore
        .flat()

    const s = block.resolvers.Subscription || {}
    const s2 = Object.keys(s)
        .map((k) => s[k] || [])
        // @ts-ignore
        .flat()

    ;[...q2, ...m2, ...s2].forEach((act: any) => {
        Object.keys(act).forEach((k: string) => {
            if (typeof act[k] === 'string') {
                if (act[k].includes('!sub')) {
                    throw new ValidationError(
                        `You are using the !sub keyword, but do not have config.auth set to true`
                    )
                }
                if (act[k].includes('!email')) {
                    throw new ValidationError(
                        `You are using the !email keyword, but do not have config.auth set to true`
                    )
                }
            }
        })
    })
    return true
}

export function checkEventFunctionsAndEventConfig(block: any) {
    if (block.config.eventBus) {
        return true
    }
    const q = block.resolvers.Query || {}
    const q2 = Object.keys(q)
        .map((k) => q[k] || [])
        // @ts-ignore
        .flat()

    const m = block.resolvers.Mutation || {}
    const m2 = Object.keys(m)
        .map((k) => m[k] || [])
        // @ts-ignore
        .flat()

    const s = block.resolvers.Subscription || {}
    const s2 = Object.keys(s)
        .map((k) => s[k] || [])
        // @ts-ignore
        .flat()

    const e = block.resolvers.Events || {}
    const e2 = Object.keys(e)
        .map((k) => e[k] || [])
        // @ts-ignore
        .flat()

    ;[...q2, ...m2, ...s2, ...e2].forEach((act: any) => {
        if (act.type === 'emit-event') {
            throw new ValidationError(
                'Cannot use emit-event action without defining config.eventBus'
            )
        }

        if (act.type === 'receive-event') {
            throw new ValidationError(
                'Cannot use receive-event action without defining config.eventBus'
            )
        }
    })

    return true
}

export function validateEvents(block: any) {
    if (!block.resolvers.Events) {
        return true
    }
    const e = block.resolvers.Events || {}

    Object.keys(block.resolvers.Events).forEach((k) => {
        const arr: any = e[k]
        if (arr.length > 1 || arr[0].type !== 'receive-event') {
            throw new ValidationError(
                'Currently event resolvers can only involve 1 action, receive-event'
            )
        }

        const receiveEventQuery = arr[0].query || ''
        const ql = gql(`${receiveEventQuery}`)
        const defs = ql.definitions

        defs.forEach((def: any) => {
            if (def.operation !== 'mutation') {
                throw new ValidationError(
                    `Events.${k} query must be a mutation`
                )
            }

            const mutationTarget = def.name.value
            if (
                !block.resolvers.Mutation ||
                !block.resolvers.Mutation[mutationTarget]
            ) {
                throw new ValidationError(
                    `Events.${k} query must be a mutation that exists in the schema`
                )
            }
        })

        //console.log(JSON.stringify(gql(`${receiveEventQuery}`), null, 2))
    })

    return true
}
