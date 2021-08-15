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

export function getBlock(io: any, path: string, flags: any) {
    const blocks = getRiseModules(io, path)
    const formatted = formatRiseBlock({
        root: blocks.root,
        modules: blocks.modules,
        flags: flags
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
