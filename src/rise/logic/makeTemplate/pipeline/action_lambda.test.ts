import { makeLambda } from './action_lambda'

test('makeLambda generates valid cloudformation', () => {
    const input = {
        appName: 'blueApp',
        name: 'processSomething',
        stage: 'dev',
        bucketArn: 'arn:s3:::myBucket',
        dbName: 'blueDB'
    }
    const result = makeLambda(input)
    expect(result.Resources).toEqual({
        LambdaprocessSomethingdevLogGroup: {
            Type: 'AWS::Logs::LogGroup',
            Properties: {
                LogGroupName: '/aws/lambda/blueApp-processSomething-dev'
            }
        },
        LambdaprocessSomethingdev: {
            Type: 'AWS::Lambda::Function',
            Properties: {
                Code: {
                    S3Bucket: 'arn:s3:::myBucket',
                    S3Key: 'functions/processSomething/lambda.zip'
                },
                FunctionName: 'blueApp-processSomething-dev',
                Handler: 'index.handler',
                MemorySize: 1024,
                Role: {
                    'Fn::GetAtt': ['LambdaprocessSomethingdevRole', 'Arn']
                },
                Runtime: 'nodejs14.x',
                Timeout: 6,
                Environment: {
                    Variables: {}
                }
            },
            DependsOn: ['LambdaprocessSomethingdevLogGroup']
        },
        LambdaprocessSomethingdevRole: {
            Type: 'AWS::IAM::Role',
            Properties: {
                AssumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                Service: ['lambda.amazonaws.com']
                            },
                            Action: ['sts:AssumeRole']
                        }
                    ]
                },
                Policies: [
                    {
                        PolicyName:
                            'LambdablueAppprocessSomethingdevRolePolicy',
                        PolicyDocument: {
                            Version: '2012-10-17',
                            Statement: [
                                {
                                    Effect: 'Allow',
                                    Action: ['dynamodb:*'],
                                    Resource: [
                                        {
                                            'Fn::Sub': [
                                                'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/blueDB',
                                                {}
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ],
                Path: '/',
                RoleName: 'LambdablueAppprocessSomethingdevRole'
            }
        },
        LambdaprocessSomethingdevDatasource: {
            Type: 'AWS::AppSync::DataSource',
            Properties: {
                ApiId: {
                    'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                },
                Name: 'LambdaprocessSomethingdevDatasource',
                Type: 'AWS_LAMBDA',
                ServiceRoleArn: {
                    'Fn::GetAtt': ['GraphQlDslambdadatasourceRole', 'Arn']
                },
                LambdaConfig: {
                    LambdaFunctionArn: {
                        'Fn::GetAtt': ['LambdaprocessSomethingdev', 'Arn']
                    }
                }
            }
        },
        LambdaprocessSomethingdevDatasourceRole: {
            Type: 'AWS::IAM::Role',
            Properties: {
                AssumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                Service: ['appsync.amazonaws.com']
                            },
                            Action: ['sts:AssumeRole']
                        }
                    ]
                },
                Policies: [
                    {
                        PolicyName:
                            'LambdablueAppprocessSomethingdevDatasourceRolePolicy',
                        PolicyDocument: {
                            Version: '2012-10-17',
                            Statement: [
                                {
                                    Action: ['lambda:invokeFunction'],
                                    Effect: 'Allow',
                                    Resource: [
                                        {
                                            'Fn::GetAtt': [
                                                'LambdaprocessSomethingdev',
                                                'Arn'
                                            ]
                                        }
                                        // {
                                        //     'Fn::Join': [
                                        //         ':',
                                        //         [
                                        //             {
                                        //                 'Fn::GetAtt': [
                                        //                     'LambdaprocessSomethingdev',
                                        //                     'Arn'
                                        //                 ]
                                        //             },
                                        //             '*'
                                        //         ]
                                        //     ]
                                        // }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        },
        FunctionLambdaprocessSomething: {
            Type: 'AWS::AppSync::FunctionConfiguration',
            Properties: {
                ApiId: {
                    'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                },
                DataSourceName: 'DbDatasource',
                FunctionVersion: '2018-05-29',
                Name: 'functionGet',
                RequestMappingTemplate:
                    '\n                {\n                  "version": "2017-02-28",\n                  "operation": "GetItem",\n                  "payload": $util.toJson($ctx.stash)\n                }',
                ResponseMappingTemplate:
                    '\n                        $util.qr($ctx.stash.put("lambdaresult", $ctx.result))\n                        $util.toJson($ctx.result)\n                    '
            },
            DependsOn: ['LambdaprocessSomethingdevDatasource', 'GraphQlSchema']
        }
    })
})
