import base from './base'

test('base will return a template successfully', () => {
    const result = base({
        schema: 'SCHEMA',
        config: {
            auth: true,
            name: 'testapp',
            region: 'us-east-1',
            eventBus: 'default'
        }
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
            },
            GraphQlSchema: {
                Type: 'AWS::AppSync::GraphQLSchema',
                Properties: {
                    Definition: 'SCHEMA',
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    }
                }
            },
            GraphQlApiKeyDefault: {
                Type: 'AWS::AppSync::ApiKey',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Expires: 1660358595
                }
            },
            DbDatasource: {
                Type: 'AWS::AppSync::DataSource',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Name: 'DbDatasource',
                    Type: 'AMAZON_DYNAMODB',
                    DynamoDBConfig: {
                        TableName: 'testapp',
                        AwsRegion: 'us-east-1'
                    },
                    ServiceRoleArn: {
                        'Fn::GetAtt': ['DbDatasourceRole', 'Arn']
                    }
                }
            },
            DbDatasourceRole: {
                Type: 'AWS::IAM::Role',
                Properties: {
                    RoleName: 'testapp-dynamodb-policy',
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
                            PolicyName: 'testappPolicyDynamoDB',
                            PolicyDocument: {
                                Version: '2012-10-17',
                                Statement: [
                                    {
                                        Effect: 'Allow',
                                        Action: ['dynamodb:*'],
                                        Resource: [
                                            {
                                                'Fn::Sub': [
                                                    'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/testapp',
                                                    {}
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
            Database: {
                Type: 'AWS::DynamoDB::Table',
                Properties: {
                    TableName: 'testapp',
                    AttributeDefinitions: [
                        {
                            AttributeName: 'pk',
                            AttributeType: 'S'
                        },
                        {
                            AttributeName: 'sk',
                            AttributeType: 'S'
                        },
                        {
                            AttributeName: 'pk2',
                            AttributeType: 'S'
                        },
                        {
                            AttributeName: 'pk3',
                            AttributeType: 'S'
                        }
                    ],
                    KeySchema: [
                        {
                            AttributeName: 'pk',
                            KeyType: 'HASH'
                        },
                        {
                            AttributeName: 'sk',
                            KeyType: 'RANGE'
                        }
                    ],
                    GlobalSecondaryIndexes: [
                        {
                            IndexName: 'pk2',
                            KeySchema: [
                                {
                                    AttributeName: 'pk2',
                                    KeyType: 'HASH'
                                },
                                {
                                    AttributeName: 'sk',
                                    KeyType: 'RANGE'
                                }
                            ],
                            Projection: {
                                ProjectionType: 'ALL'
                            }
                        },
                        {
                            IndexName: 'pk3',
                            KeySchema: [
                                {
                                    AttributeName: 'pk3',
                                    KeyType: 'HASH'
                                },
                                {
                                    AttributeName: 'sk',
                                    KeyType: 'RANGE'
                                }
                            ],
                            Projection: {
                                ProjectionType: 'ALL'
                            }
                        }
                    ],
                    BillingMode: 'PAY_PER_REQUEST'
                }
            },
            EventBridgeDataSource: {
                Type: 'AWS::AppSync::DataSource',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Name: 'EventBridgeDataSource',
                    Type: 'HTTP',
                    HttpConfig: {
                        AuthorizationConfig: {
                            AuthorizationType: 'AWS_IAM',
                            AwsIamConfig: {
                                SigningRegion: 'us-east-1',
                                SigningServiceName: 'events'
                            }
                        },
                        Endpoint: 'https://events.us-east-1.amazonaws.com/'
                    },
                    ServiceRoleArn: {
                        'Fn::GetAtt': ['EventDatasourceRole', 'Arn']
                    }
                }
            },
            EventDatasourceRole: {
                Type: 'AWS::IAM::Role',
                Properties: {
                    RoleName: 'testapp-eventds-policy',
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
                            PolicyName: 'testappPolicyEventDS',
                            PolicyDocument: {
                                Version: '2012-10-17',
                                Statement: [
                                    {
                                        Effect: 'Allow',
                                        Action: ['events:Put*'],
                                        Resource: [
                                            {
                                                'Fn::Sub': [
                                                    'arn:aws:events:${AWS::Region}:${AWS::AccountId}:event-bus/default',
                                                    {}
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
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
            },
            ApiKey: {
                Description: 'ApiKey',
                Value: {
                    'Fn::GetAtt': ['GraphQlApiKeyDefault', 'ApiKey']
                }
            },
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
