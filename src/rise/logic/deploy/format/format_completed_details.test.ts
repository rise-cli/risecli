import { formatCompletedDetails } from './format_completed_details'

test('formatCompletedDetails will return valid details object', () => {
    const input = {
        outputs: [
            {
                OutputKey: 'ApiUrl',
                OutputValue:
                    'https://k3e3aujayfbbvducyrzd5a2zpu.appsync-api.us-east-2.amazonaws.com/graphql'
            },
            {
                OutputKey: 'ApiKey',
                OutputValue: 'da2-3qsnjnw4fjfrnlhxltjw4lcosu'
            },
            {
                OutputKey: 'UserPoolId',
                OutputValue: 'us-east-1_1yVS8ntIm'
            },
            {
                OutputKey: 'UserPoolClientId',
                OutputValue: '14ag4072292mrr4hv4g0p4beji'
            },
            {
                OutputKey: 'EventBridgeArn',
                OutputValue:
                    'arn:aws:events:us-east-1:251256923172:event-bus/default'
            },
            {
                OutputKey: 'AppsyncId',
                OutputValue:
                    'arn:aws:appsync:us-east-1:251256923172:apis/i54x7t2yk5azbasjpeguvl3tp4'
            }
        ]
    }

    const result = formatCompletedDetails(input)
    expect(result).toEqual({
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
    })
})

test('formatCompletedDetails will return false if some values are not present', () => {
    const input = {
        outputs: [
            {
                OutputKey: 'ApiUrl',
                OutputValue:
                    'https://k3e3aujayfbbvducyrzd5a2zpu.appsync-api.us-east-2.amazonaws.com/graphql'
            },
            {
                OutputKey: 'ApiKey',
                OutputValue: 'da2-3qsnjnw4fjfrnlhxltjw4lcosu'
            },
            {
                OutputKey: 'AppsyncId',
                OutputValue:
                    'arn:aws:appsync:us-east-1:251256923172:apis/i54x7t2yk5azbasjpeguvl3tp4'
            }
        ]
    }

    const result = formatCompletedDetails(input)
    expect(result).toEqual({
        apiKey: 'da2-3qsnjnw4fjfrnlhxltjw4lcosu',
        appsyncId: 'i54x7t2yk5azbasjpeguvl3tp4',
        eventBridgeArn: false,
        region: 'us-east-1',
        status: 'success',
        message: 'success',
        url: 'https://k3e3aujayfbbvducyrzd5a2zpu.appsync-api.us-east-2.amazonaws.com/graphql',
        userPoolClientId: false,
        userPoolId: false
    })
})
