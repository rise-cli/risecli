import makeGraphQL from './base_graphql'

test('makeGraphQL will make graph with api key as authentication type', () => {
    const result = makeGraphQL({
        name: 'testapp',
        auth: false,
        region: 'us-east-1'
    })

    expect(result).toEqual({
        Resources: {
            GraphQlApi: {
                Type: 'AWS::AppSync::GraphQLApi',
                Properties: {
                    Name: 'testapp',
                    XrayEnabled: false,
                    AuthenticationType: 'API_KEY',
                    AdditionalAuthenticationProviders: [
                        {
                            AuthenticationType: 'AWS_IAM'
                        }
                    ]
                }
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
    })
})

test('makeGraphQL will make graph with cognito as authentication type', () => {
    const result = makeGraphQL({
        name: 'testapp',
        auth: true,
        region: 'us-east-1'
    })

    expect(result).toEqual({
        Resources: {
            GraphQlApi: {
                Type: 'AWS::AppSync::GraphQLApi',
                Properties: {
                    Name: 'testapp',
                    XrayEnabled: false,
                    AuthenticationType: 'AMAZON_COGNITO_USER_POOLS',
                    UserPoolConfig: {
                        AwsRegion: 'us-east-1',
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
    })
})
