type Input = {
    status: string
    message: string
    name: string
    apiKey: string | boolean
    appsyncId: string | boolean
    eventBridgeArn: string | boolean
    region: string | boolean
    url: string | boolean
    userPoolClientId: string | boolean
    userPoolId: string | boolean
}

const output = (terminal: any) => ({
    clear() {
        terminal.clear()
    }
})

export function displayCompletedDetails(terminal: any, result: Input) {
    output(terminal).clear()

    terminal.write('')
    terminal.write('Endpoint:          ' + result.url)
    terminal.write('Region:            ' + result.region)

    if (result.apiKey) {
        terminal.write('Api Key:           ' + result.apiKey)
    }

    if (result.eventBridgeArn) {
        terminal.write('EventBridge Arn:   ' + result.eventBridgeArn)
    }

    if (result.userPoolId) {
        terminal.write('UserPool ID:       ' + result.userPoolId)
    }

    if (result.userPoolClientId) {
        terminal.write('UserPoolClient ID: ' + result.userPoolClientId)
    }

    const appsyncConsoleUrl = `https://${result.region}.console.aws.amazon.com/appsync/home?region=${result.region}#/${result.appsyncId}/v1/queries`
    terminal.write('')
    terminal.write('Appsync Console: ' + appsyncConsoleUrl)

    const dynamoConsoleUrl = `https://${result.region}.console.aws.amazon.com/dynamodb/home?region=${result.region}#tables:selected=${result.name};tab=items`
    terminal.write('')
    terminal.write('DynamoDB Console: ' + dynamoConsoleUrl)

    if (result.userPoolId) {
        const userPoolId = result.userPoolId
        const cognitoConsoleUrl = `https://${result.region}.console.aws.amazon.com/cognito/users/?region=${result.region}#/pool/${userPoolId}`
        terminal.write('')
        terminal.write('Cognito Console: ' + cognitoConsoleUrl)
    }
}
