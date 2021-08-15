import makeDatasource from './base_datasource_events'

test('makeDb will make CF JSON for dynamodb table', () => {
    const result = makeDatasource({
        eventBus: 'testevents',
        region: 'us-east-1',
        apiName: 'testapi'
    })

    expect(result).toEqual({
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
                    RoleName: `testapi-eventds-policy`,
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
                            PolicyName: `testapiPolicyEventDS`,
                            PolicyDocument: {
                                Version: '2012-10-17',

                                Statement: [
                                    {
                                        Effect: 'Allow',
                                        Action: ['events:Put*'],
                                        Resource: [
                                            {
                                                'Fn::Sub': [
                                                    'arn:aws:events:${AWS::Region}:${AWS::AccountId}:event-bus/testevents',
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
    })
})
