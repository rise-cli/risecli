/**
 * TODO: dont hardcode the expires date. Make it a year
 * out from todays date instead
 *
 */

export default function makeApiKey() {
    const TODAYS_DATE = Math.floor(Date.now() / 1000)
    const YEAR_IN_SECONDS = 31457600
    const YEAR_FROM_NOW = TODAYS_DATE + YEAR_IN_SECONDS

    const expires = process.env.NODE_ENV === 'test' ? 1660358595 : YEAR_FROM_NOW

    return {
        Resources: {
            GraphQlApiKeyDefault: {
                Type: 'AWS::AppSync::ApiKey',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Expires: expires
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
