import { displayCompletedDetails } from './display_completed_details'

test('displayCompletedDetails will render styled table to terminal', () => {
    let successDisplay: any[] = []
    const io = {
        terminal: {
            write: (x: any) => {
                successDisplay.push(x)
            },
            clear: () => {
                successDisplay = []
            }
        }
    }

    const details = {
        name: 'appname',
        apiKey: 'da2-3qsnjnw4fjfrnlhxltjw4lcosu',
        appsyncId: 'i54x7t2yk5azbasjpeguvl3tp4',
        eventBridgeArn:
            'arn:aws:events:us-east-1:251256923172:event-bus/default',
        region: 'us-east-1',
        status: 'success',
        message: 'success',
        url: 'https://k3e3aujayfbbvducyrzd5a2zpu.appsync-api.us-east-2.amazonaws.com/graphql',
        userPoolClientId: '14ag4072292mrr4hv4g0p4beji',
        userPoolId: 'us-east-1_1yVS8ntIm'
    }

    displayCompletedDetails(io.terminal, details)

    expect(successDisplay).toEqual([
        '',
        'Endpoint:          https://k3e3aujayfbbvducyrzd5a2zpu.appsync-api.us-east-2.amazonaws.com/graphql',
        'Region:            us-east-1',
        'Api Key:           da2-3qsnjnw4fjfrnlhxltjw4lcosu',
        'EventBridge Arn:   arn:aws:events:us-east-1:251256923172:event-bus/default',
        'UserPool ID:       us-east-1_1yVS8ntIm',
        'UserPoolClient ID: 14ag4072292mrr4hv4g0p4beji',
        '',
        'Appsync Console: https://us-east-1.console.aws.amazon.com/appsync/home?region=us-east-1#/i54x7t2yk5azbasjpeguvl3tp4/v1/queries',
        '',
        'DynamoDB Console: https://us-east-1.console.aws.amazon.com/dynamodb/home?region=us-east-1#tables:selected=appname;tab=items',
        '',
        'Cognito Console: https://us-east-1.console.aws.amazon.com/cognito/users/?region=us-east-1#/pool/us-east-1_1yVS8ntIm'
    ])
})

test('displayCompletedDetails will not render event bridge if no evenbus is defined', () => {
    let successDisplay: any[] = []
    const io = {
        terminal: {
            write: (x: any) => {
                successDisplay.push(x)
            },
            clear: () => {
                successDisplay = []
            }
        }
    }

    const details = {
        name: 'appname',
        apiKey: 'da2-3qsnjnw4fjfrnlhxltjw4lcosu',
        appsyncId: 'i54x7t2yk5azbasjpeguvl3tp4',
        eventBridgeArn: false,
        region: 'us-east-1',
        status: 'success',
        message: 'success',
        url: 'https://k3e3aujayfbbvducyrzd5a2zpu.appsync-api.us-east-2.amazonaws.com/graphql',
        userPoolClientId: '14ag4072292mrr4hv4g0p4beji',
        userPoolId: 'us-east-1_1yVS8ntIm'
    }

    displayCompletedDetails(io.terminal, details)

    expect(successDisplay).toEqual([
        '',
        'Endpoint:          https://k3e3aujayfbbvducyrzd5a2zpu.appsync-api.us-east-2.amazonaws.com/graphql',
        'Region:            us-east-1',
        'Api Key:           da2-3qsnjnw4fjfrnlhxltjw4lcosu',
        'UserPool ID:       us-east-1_1yVS8ntIm',
        'UserPoolClient ID: 14ag4072292mrr4hv4g0p4beji',
        '',
        'Appsync Console: https://us-east-1.console.aws.amazon.com/appsync/home?region=us-east-1#/i54x7t2yk5azbasjpeguvl3tp4/v1/queries',
        '',
        'DynamoDB Console: https://us-east-1.console.aws.amazon.com/dynamodb/home?region=us-east-1#tables:selected=appname;tab=items',
        '',
        'Cognito Console: https://us-east-1.console.aws.amazon.com/cognito/users/?region=us-east-1#/pool/us-east-1_1yVS8ntIm'
    ])
})
