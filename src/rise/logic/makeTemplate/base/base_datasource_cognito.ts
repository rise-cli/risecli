export default function datasourceCognito({
    region,
    apiName
}: {
    region: string
    apiName: string
}) {
    return {
        Resources: {
            CognitoDataSource: {
                Type: 'AWS::AppSync::DataSource',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Name: 'CognitoDataSource',
                    Type: 'HTTP',
                    HttpConfig: {
                        AuthorizationConfig: {
                            AuthorizationType: 'AWS_IAM',
                            AwsIamConfig: {
                                SigningRegion: region,
                                SigningServiceName: 'cognito-idp'
                            }
                        },
                        Endpoint:
                            'https://cognito-idp.' + region + '.amazonaws.com/'
                    },
                    ServiceRoleArn: {
                        'Fn::GetAtt': ['CognitoDatasourceRole', 'Arn']
                    }
                }
            },
            CognitoDatasourceRole: {
                Type: 'AWS::IAM::Role',
                Properties: {
                    RoleName: `${apiName}-cognitods-policy`,
                    AssumeRolePolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: ['sts:AssumeRole'],
                                Principal: {
                                    Service: ['appsync.amazonaws.com']
                                }
                            }
                        ]
                    },

                    Policies: [
                        {
                            PolicyName: `${apiName}PolicyCognitoDS`,
                            PolicyDocument: {
                                Version: '2012-10-17',

                                Statement: [
                                    {
                                        Effect: 'Allow',
                                        Action: [
                                            'cognito-idp:AdminDeleteUser',
                                            'cognito-idp:AdminCreateUser',
                                            'cognito-idp:ListUsers'
                                        ],
                                        Resource: [
                                            {
                                                'Fn::Sub': [
                                                    'arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${Id}',
                                                    {
                                                        Id: {
                                                            Ref: 'CognitoUserPoolMyUserPool'
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        },
        Outputs: {}
    }
}
