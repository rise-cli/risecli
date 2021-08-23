import { formatRiseBlock } from './format'
import { getRiseModules } from './get'
import {
    isValidApp,
    validateSchemaMatchesResolvers,
    listResolverHasListSchemaDef,
    confirmAllInputsAreSingleInputVariables,
    checkGuardsWithIdWithoutCognitoSetup,
    checkEventFunctionsAndEventConfig,
    validateEvents
} from './validate_app'

type GetBlockInput = {
    io: any
    path: string
    flags: any
}

export function getBlock(props: GetBlockInput) {
    const blocks = getRiseModules(props.io, props.path)
    const formatted = formatRiseBlock({
        root: blocks.root,
        modules: blocks.modules,
        flags: props.flags
    })

    /**
     * Validate Rise App Scenarios
     *
     */
    isValidApp(formatted)
    validateSchemaMatchesResolvers(formatted)
    listResolverHasListSchemaDef(formatted)
    confirmAllInputsAreSingleInputVariables(formatted)
    checkGuardsWithIdWithoutCognitoSetup(formatted)
    checkEventFunctionsAndEventConfig(formatted)
    validateEvents(formatted)

    return formatted
}
