import { validateBlockStructure, validateAction } from './validate_input'
const qlmerge = require('@graphql-tools/merge')

type FormatInput = {
    root: any
    modules: any[]
    flags: any
}

function combineAllSchemasIntoOne(schemas: string[]) {
    const ast = qlmerge.mergeTypeDefs(schemas)
    return qlmerge.printWithComments(ast)
}

function combineResolvers(blocks: any[]) {
    const resolvers: any = {
        Query: {},
        Mutation: {},
        Events: {}
    }

    blocks.forEach((block) => {
        const queries = block.resolvers.Query || {}
        const mutations = block.resolvers.Mutation || {}
        const events = block.resolvers.Events || {}
        Object.keys(queries).forEach((key: string) => {
            const actionArray = Array.isArray(queries[key])
                ? queries[key]
                : [queries[key]]

            actionArray.forEach(validateAction)
            resolvers.Query[key] = actionArray
        })

        Object.keys(mutations).forEach((key: string) => {
            const actionArray = Array.isArray(mutations[key])
                ? mutations[key]
                : [mutations[key]]

            actionArray.forEach(validateAction)
            resolvers.Mutation[key] = actionArray
        })

        Object.keys(events).forEach((key: string) => {
            resolvers.Events[key] = events[key]
        })
    })

    return resolvers
}

function createConfig(flags: any, block: any) {
    const name = block.config.name.split(' ').join('')
    const profile = flags.profile || block.config.profile || 'default'
    const region = flags.region || block.config.region || 'us-east-1'
    const stage = flags.stage || block.config.stage || 'dev'
    const auth = block.config.auth || false
    const eventBus = block.config.eventBus || false

    return {
        name,
        auth,
        profile,
        region,
        stage,
        eventBus
    }
}

export function formatRiseBlock(input: FormatInput) {
    /**
     * General Validation
     */
    validateBlockStructure(input.root, false)
    input.modules.forEach((x) => {
        validateBlockStructure(x, true)
    })

    /**
     * Combine Schemas
     *
     */
    const schema = combineAllSchemasIntoOne([
        input.root.schema,
        ...input.modules.map((x) => x.schema)
    ])

    /**
     * Combine Resolvers
     *
     */
    const resolvers = combineResolvers([input.root, ...input.modules])

    /**
     * Create Config
     *
     */
    const config = createConfig(input.flags, input.root)

    return {
        schema,
        resolvers,
        config
    }
}
