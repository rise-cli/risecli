export default function datasourceEventBridge({
    eventBus,
    region,
    apiName
}: {
    eventBus: string
    region: string
    apiName: string
}) {
    return {
        Resources: {
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
                                SigningRegion: region,
                                SigningServiceName: 'events'
                            }
                        },
                        Endpoint: 'https://events.' + region + '.amazonaws.com/'
                    },
                    ServiceRoleArn: {
                        'Fn::GetAtt': ['EventDatasourceRole', 'Arn']
                    }
                }
            },
            EventDatasourceRole: {
                Type: 'AWS::IAM::Role',
                Properties: {
                    RoleName: `${apiName}-eventds-policy`,
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
                            PolicyName: `${apiName}PolicyEventDS`,
                            PolicyDocument: {
                                Version: '2012-10-17',

                                Statement: [
                                    {
                                        Effect: 'Allow',
                                        Action: ['events:Put*'],
                                        Resource: [
                                            {
                                                'Fn::Sub': [
                                                    'arn:aws:events:${AWS::Region}:${AWS::AccountId}:event-bus/' +
                                                        eventBus,
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
            }
        },
        Outputs: {}
    }
}
