import { ValidationError } from '../../utils/errors'

export function validateBlockStructure(block: any, isModule: boolean) {
    if (JSON.stringify(block).includes('RISE_')) {
        throw new ValidationError(
            'RISE_ is a reserved string and cannot be used in your rise app definition'
        )
    }

    if (!block.schema || typeof block.schema !== 'string') {
        throw new ValidationError('Rise block does have a valid GraphQL schema')
    }

    if (!block.resolvers || Object.keys(block.resolvers).length === 0) {
        throw new ValidationError('Rise block does not have resolvers defined')
    }

    if (!isModule && !block.config) {
        throw new ValidationError(
            'The rise.js file at the root of your project must have config defined'
        )
    }

    if (!isModule && !block.config.name) {
        throw new ValidationError(
            'The rise.js file at the root of your project must have config.name defined'
        )
    }

    return true
}

export function validateAction(action: any) {
    if (
        !['db', 'guard', 'add', 'emit-event', 'function', 'users'].includes(
            action.type
        )
    ) {
        throw new ValidationError(
            `${action.type} is not a valid action for Queries or Mutations`
        )
    }

    if (['guard', 'add'].includes(action.type)) {
        Object.keys(action).forEach((key: string) => {
            if (typeof action[key] !== 'string') {
                throw new ValidationError(
                    `Action Validation Error: ${key} on type ${action.type} must be a string`
                )
            }
        })
    }

    if (action.type === 'db') {
        if (!['set', 'get', 'list', 'remove'].includes(action.action)) {
            throw new ValidationError(
                action.action +
                    ' is not a valid db action. Valid types are: "set", "remove", "get", "list"'
            )
        }
    }

    if (action.type === 'users') {
        if (!['add', 'remove'].includes(action.action)) {
            throw new ValidationError(
                action.action +
                    ' is not a valid users action. Valid types are: "add", "remove"'
            )
        }
    }

    if (action.type === 'guard') {
        if (!action.pk && !action.pk2 && !action.pk3) {
            throw new ValidationError(
                'guard actions must have either pk, pk2, or pk3 defined'
            )
        }
        if (!action.sk) {
            throw new ValidationError('guard actions must have sk defined')
        }
    }
    return true
}
