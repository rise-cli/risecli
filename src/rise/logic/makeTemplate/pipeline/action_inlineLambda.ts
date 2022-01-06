type Input = {
    appName: string
    name: string
    stage: String
    bucketArn: string
    dbName: string
}

export function makeLambda(props: Input) {
    console.log('BCKET ARN:::: ', props.bucketArn)

    const b = props.bucketArn.split(':::')[1]
    return {
        Resources: {
            /**
             * Log Group
             */
            [`InlineLambda${props.name}${props.stage}LogGroup`]: {
                Type: 'AWS::Logs::LogGroup',
                Properties: {
                    LogGroupName: `/aws/lambda/${props.appName}-${props.name}-${props.stage}`
                }
            },

            /**
             * Lambda Function
             * and Role
             */
            [`InlineLambda${props.name}${props.stage}`]: {
                Type: 'AWS::Lambda::Function',
                Properties: {
                    Code: {
                        S3Bucket: b,
                        S3Key: `functions/${props.name}/lambda.zip`
                    },
                    FunctionName: `${props.appName}-${props.name}-${props.stage}`,
                    Handler: 'index.handler',
                    MemorySize: 1024,
                    Role: {
                        'Fn::GetAtt': [
                            `Lambda${props.name}${props.stage}Role`,
                            'Arn'
                        ]
                    },
                    Runtime: 'nodejs12.x',
                    Timeout: 6
                    // Environment: {
                    //     Variables: {
                    //         // ...future feature add
                    //     }
                    // }
                },
                DependsOn: [`Lambda${props.name}${props.stage}LogGroup`]
            },
            [`InlineLambda${props.name}${props.stage}Role`]: {
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
                            PolicyName: `InlineLambda${props.appName}${props.name}${props.stage}RolePolicy`,
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
                                                        props.dbName,
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
                    RoleName: `InlineLambda${props.appName}${props.name}${props.stage}Role`
                }
            },
            /**
             * Lambda Function Datasource
             * and Role
             */
            [`InlineLambda${props.name}${props.stage}Datasource`]: {
                Type: 'AWS::AppSync::DataSource',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Name: `InlineLambda${props.name}${props.stage}Datasource`,
                    // Description: 'Main Lambda function',
                    Type: 'AWS_LAMBDA',
                    ServiceRoleArn: {
                        'Fn::GetAtt': [
                            `InlineLambda${props.name}${props.stage}DatasourceRole`,
                            'Arn'
                        ]
                    },
                    LambdaConfig: {
                        LambdaFunctionArn: {
                            'Fn::GetAtt': [
                                `InlineLambda${props.name}${props.stage}`,
                                'Arn'
                            ]
                        }
                    }
                }
            },

            [`InlineLambda${props.name}${props.stage}DatasourceRole`]: {
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
                            PolicyName: `InlineLambda${props.appName}${props.name}${props.stage}DatasourceRolePolicy`,
                            PolicyDocument: {
                                Version: '2012-10-17',
                                Statement: [
                                    {
                                        Action: ['lambda:invokeFunction'],
                                        Effect: 'Allow',
                                        Resource: [
                                            {
                                                'Fn::GetAtt': [
                                                    `InlineLambda${props.name}${props.stage}`,
                                                    'Arn'
                                                ]
                                            }
                                            // {
                                            //     'Fn::Join': [
                                            //         ':',
                                            //         [
                                            //             {
                                            //                 'Fn::GetAtt': [
                                            //                     `Lambda${props.name}${props.stage}`,
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

            /**
             * AppSync Function
             */
            ['InlineFunctionLambda' + props.name]: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: `InlineLambda${props.name}${props.stage}Datasource`,
                    FunctionVersion: '2018-05-29',
                    Name: 'functionLambda' + props.name,
                    RequestMappingTemplate: `
                {
                  "version": "2017-02-28",
                  "operation": "Invoke",
                  "payload": $util.toJson($ctx.stash)
                }`,

                    ResponseMappingTemplate: `
                        $util.qr($ctx.stash.put("dbresult", $ctx.result))
                        $util.toJson($ctx.result)
                    `
                },
                DependsOn: [
                    `InlineLambda${props.name}${props.stage}Datasource`,
                    'GraphQlSchema'
                ]
            }
        },
        Outputs: {}
    }
}
