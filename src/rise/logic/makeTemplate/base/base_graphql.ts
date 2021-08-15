export default function graphQL({
    name,
    auth = false,
    region
}: {
    name: string
    auth: boolean
    region: string
}) {
    const apiWithCognito = {
        Name: name,
        XrayEnabled: false,
        AuthenticationType: 'AMAZON_COGNITO_USER_POOLS',
        UserPoolConfig: {
            AwsRegion: region,
            UserPoolId: {
                Ref: 'CognitoUserPoolMyUserPool'
            },
            DefaultAction: 'ALLOW'
        },

        AdditionalAuthenticationProviders: [
            {
                AuthenticationType: 'API_KEY'
            },
            {
                AuthenticationType: 'AWS_IAM'
            }
        ]
    }

    const apiWithoutCognito = {
        Name: name,
        XrayEnabled: false,
        AuthenticationType: 'API_KEY',
        AdditionalAuthenticationProviders: [
            {
                AuthenticationType: 'AWS_IAM'
            }
        ]
    }

    const authActivated = auth && typeof auth === 'boolean'

    return {
        Resources: {
            GraphQlApi: {
                Type: 'AWS::AppSync::GraphQLApi',
                Properties: authActivated ? apiWithCognito : apiWithoutCognito
            }
        },
        Outputs: {
            ApiUrl: {
                Description: 'URL',
                Value: {
                    'Fn::GetAtt': ['GraphQlApi', 'GraphQLUrl']
                }
            },
            AppsyncId: {
                Description: 'AppsyncId',
                Value: {
                    Ref: 'GraphQlApi'
                }
            }
        }
    }
}
