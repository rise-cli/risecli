/**
 * RiseCommandInput
 * This represents the input from the cli deploy command.
 *
 */
export interface RiseCommandInput {
    profile?: string
    region?: string
    stage?: string
}

/**
 * Rise Block
 * This represents the entire project definition and will inform
 * how the cloudformation should be built, and how appsync should
 * be configured
 *
 */
export interface RiseBlock {
    schema: RiseBlockApi
    resolvers: RiseBlockCode
    config: RiseBlockConfig
}

type RiseBlockConfig = {
    name: string
    profile: string
    region: string
    stage: string
    auth: boolean

    eventBus?: string
}

type RiseBlockApi = string
type RiseBlockCode = {
    // Query?: Record<string, Function | Resolver>
    // Mutation?: Record<string, Function | Resolver>
    // Events?: Record<string, Function | Resolver>
    Query?: {
        [key: string]: Function | Resolver
    }
    Mutation?: {
        [key: string]: Function | Resolver
    }
    Subscription?: {
        [key: string]: Function | Resolver
    }
    Events?: {
        [key: string]: Function | Resolver
    }
}

/**
 * Rise Output
 * Once the app has been deployed, the following details we be outputed
 * which will allow us to print info to the terminal, and write a helpful
 * info.md file. In the future, this may aslo be where we derive state.
 *
 */
export interface RiseOutput {
    endpoint: string
    table: string
    apiKey?: string
    userPool?: UserPoolSettings
}

type UserPoolSettings = {
    userPoolId: string
    userPoolRegion: string
    userPoolClientId: string
}

/**
 * Actions
 *
 */
type DbActionDefinition = {
    type: 'db'
    action: 'set' | 'remove' | 'get' | 'list'
    sk?: string
    pk?: string
    pk2?: string
    pk3?: string
}

type AddActionDefinition = {
    type: 'add'
    [value: string]: string
}

type GuardActionDefinition = {
    type: 'guard'
    sk: string
    pk?: string
    pk2?: string
    pk3?: string
}

export type ActionDefinition =
    | DbActionDefinition
    | AddActionDefinition
    | GuardActionDefinition

export type Resolver = ActionDefinition | ActionDefinition[]
