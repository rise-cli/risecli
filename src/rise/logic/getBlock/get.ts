import { ValidationError } from '../../utils/errors'

// fs.readFileSync(path.join(pathString, '/schema.graphql'), 'utf8')

/**
 * Get rise.js file at the root of the project. If not there,
 * throw error notifying user there is no rise.js file
 */
function getRootRiseFile(io: any, pathPrefix: string) {
    let block: any

    try {
        block = io.getJsFile(pathPrefix + '/rise.js')
    } catch {
        throw new ValidationError('Your project does not have a rise.js file')
    }

    if (!block.schema) {
        try {
            block.schema = io.getFile(pathPrefix + '/schema.graphql')
        } catch (e) {
            throw new ValidationError(
                'Your rise.js file does not have schema defined, and does not have a schema.graphql file'
            )
        }
    }
    return block
}

/**
 * Get /modules/[moduleName]/rise.js file. If there is no
 * rise.js file within the folder, throws error mentioning
 * their module folder does not have a rise.js file
 */
function getModuleRiseFile(io: any, pathPrefix: string) {
    let block: any
    try {
        block = io.getJsFile(pathPrefix + '/rise.js')
    } catch {
        throw new ValidationError(
            `Your module does not have a rise.js file. Path: ${pathPrefix}`
        )
    }

    if (!block.schema) {
        try {
            block.schema = io.getFile(pathPrefix + '/schema.graphql')
        } catch (e) {
            throw new ValidationError(
                `Your module does not have schema defined, and does not have a schema.graphql file. Path: ${pathPrefix}`
            )
        }
    }
    return block
}

type RiseModulesOutput = {
    root: any
    modules: any[]
}

export function getRiseModules(io: any, pathPrefix: string): RiseModulesOutput {
    let block = getRootRiseFile(io, pathPrefix)

    let moduleFolders
    try {
        moduleFolders = io.getDirectories(pathPrefix + '/modules')
    } catch (e) {
        moduleFolders = []
    }

    let nestedBlocks = []
    for (const module of moduleFolders) {
        const path = pathPrefix + '/modules/' + module
        const nestedBlock = getModuleRiseFile(io, path)
        nestedBlocks.push(nestedBlock)
    }

    return {
        root: block,
        modules: nestedBlocks
    }
}
