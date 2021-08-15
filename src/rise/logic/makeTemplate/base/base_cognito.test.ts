import makeCognito from './base_cognito'

test('makeCognito will make empty resource if auth is set to false', () => {
    const result = makeCognito({
        name: 'testapp',
        active: false
    })

    expect(result).toEqual({
        Resources: {},
        Outputs: {}
    })
})

test('makeCognito will make CF JSON for cognito', () => {
    const result = makeCognito({
        name: 'testapp',
        active: true
    })

    expect(result).toEqual({
        Resources: {
            CognitoUserPoolMyUserPool: {
                Type: 'AWS::Cognito::UserPool',
                Properties: {
                    UserPoolName: 'testapp-user-pool',
                    UsernameAttributes: ['email'],
                    AutoVerifiedAttributes: ['email'],
                    AdminCreateUserConfig: {
                        AllowAdminCreateUserOnly: true,
                        InviteMessageTemplate: {
                            EmailSubject: 'You are being invited to join'
                        },
                        UnusedAccountValidityDays: 365
                    }
                }
            },
            CognitoUserPoolClient: {
                Type: 'AWS::Cognito::UserPoolClient',
                Properties: {
                    ClientName: 'testapp-user-pool-client',
                    UserPoolId: {
                        Ref: 'CognitoUserPoolMyUserPool'
                    },
                    ExplicitAuthFlows: ['ADMIN_NO_SRP_AUTH'],
                    GenerateSecret: false
                }
            }
        },
        Outputs: {
            UserPoolId: {
                Value: {
                    Ref: 'CognitoUserPoolMyUserPool'
                }
            },
            UserPoolClientId: {
                Value: {
                    Ref: 'CognitoUserPoolClient'
                }
            }
        }
    })
})
