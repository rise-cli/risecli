/**
 * TODO: dont hardcode the expires date. Make it a year
 * out from todays date instead
 *
 */

export default function makeApiKey() {
    return {
        Resources: {
            GraphQlApiKeyDefault: {
                Type: 'AWS::AppSync::ApiKey',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Expires: 1660358595
                }
            }
        },
        Outputs: {
            ApiKey: {
                Description: 'ApiKey',
                Value: {
                    'Fn::GetAtt': ['GraphQlApiKeyDefault', 'ApiKey']
                }
            }
        }
    }
}
