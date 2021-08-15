import makeDatasource from './base_datasource_db'

test('makeDb will make CF JSON for dynamodb table', () => {
    const result = makeDatasource({
        dbName: 'testdb',
        region: 'us-east-1',
        apiName: 'testapi'
    })

    expect(result).toEqual({
        Resources: {
            DbDatasource: {
                Type: 'AWS::AppSync::DataSource',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Name: 'DbDatasource',
                    Type: 'AMAZON_DYNAMODB',
                    DynamoDBConfig: {
                        TableName: 'testdb',
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
                    RoleName: `testapi-dynamodb-policy`,
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
                            PolicyName: `testapiPolicyDynamoDB`,
                            PolicyDocument: {
                                Version: '2012-10-17',

                                Statement: [
                                    {
                                        Effect: 'Allow',
                                        Action: ['dynamodb:*'],
                                        Resource: [
                                            {
                                                'Fn::Sub': [
                                                    'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/testdb',
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
