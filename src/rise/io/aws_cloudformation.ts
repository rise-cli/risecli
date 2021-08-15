/**
 * Create Stack
 *
 */
type CreateStackInput = {
    name: string
    template: string
}

export const createStack =
    (AWS: any) =>
    async (input: CreateStackInput): Promise<any> => {
        const cloudformation = new AWS.CloudFormation()
        const params = {
            StackName: input.name,
            Capabilities: [
                'CAPABILITY_IAM',
                'CAPABILITY_AUTO_EXPAND',
                'CAPABILITY_NAMED_IAM'
            ],
            TemplateBody: input.template
        }

        return await cloudformation.createStack(params).promise()
    }

/**
 * Remove Stack
 *
 */
type RemoveStackInput = {
    name: string
}

export const removeStack =
    (AWS: any) =>
    async (input: RemoveStackInput): Promise<unknown> => {
        const cloudformation = new AWS.CloudFormation()
        const params = {
            StackName: input.name
        }
        return await cloudformation.deleteStack(params).promise()
    }

/**
 * Update Stack
 *
 */
type UpdateStackInput = {
    name: string
    template: string
}

export const updateStack =
    (AWS: any) =>
    async (input: UpdateStackInput): Promise<unknown> => {
        const cloudformation = new AWS.CloudFormation()
        const params = {
            StackName: input.name,
            Capabilities: [
                'CAPABILITY_IAM',
                'CAPABILITY_AUTO_EXPAND',
                'CAPABILITY_NAMED_IAM'
            ],
            TemplateBody: input.template
        }

        return await cloudformation.updateStack(params).promise()
    }

/**
 * GetStackInfo
 *
 */
export const getStackInfo = (AWS: any) => async (name: string) => {
    const cloudformation = new AWS.CloudFormation()
    const params = {
        StackName: name
    }

    const x = await cloudformation.describeStacks(params).promise()
    return x.Stacks[0]
}

/**
 * GetStackResourceStatus
 *
 */
export const getStackResourceStatus = (AWS: any) => async (name: string) => {
    const cloudformation = new AWS.CloudFormation()
    const params = {
        StackName: name
    }

    return await cloudformation.describeStackResources(params).promise()
}
