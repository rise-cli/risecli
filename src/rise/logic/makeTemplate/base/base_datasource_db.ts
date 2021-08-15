export default function makeDbDatasource({
    dbName,
    region,
    apiName
}: {
    dbName: string
    region: string
    apiName: string
}) {
    return {
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
                        TableName: dbName,
                        AwsRegion: region
                    },
                    ServiceRoleArn: {
                        'Fn::GetAtt': ['DbDatasourceRole', 'Arn']
                    }
                }
            },
            DbDatasourceRole: {
                Type: 'AWS::IAM::Role',
                Properties: {
                    RoleName: `${apiName}-dynamodb-policy`,
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
                            PolicyName: `${apiName}PolicyDynamoDB`,
                            PolicyDocument: {
                                Version: '2012-10-17',

                                Statement: [
                                    {
                                        Effect: 'Allow',
                                        Action: ['dynamodb:*'],
                                        Resource: [
                                            {
                                                'Fn::Sub': [
                                                    'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/' +
                                                        dbName,
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
