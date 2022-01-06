import { makeInput } from './_utils/makeInput'

type Input = {
    appName: string
    name: string
    stage: String
    bucketArn: string
    dbName: string
    permissions?: any[]
    input?: any
}

const getPermisions = (id: string): any[] => {
    try {
        const x = require(process.cwd() +
            '/functions/' +
            id +
            '/permissions.js')

        if (x.permissions) {
            console.log(x.permissions)
            return x.permissions
        }
    } catch (e) {
        console.log('..er: ', e)
        return []
    }
    return []
}

export function makeLambda(props: Input) {
    const permissions = getPermisions(props.name)

    const b = props.bucketArn.split(':::')[1]

    let template = ''
    if (props.input) {
        template = makeInput(props.input)
        template =
            template +
            `
                {
                  "version": "2017-02-28",
                  "operation": "Invoke",
                  "payload": $util.toJson($ctx.stash.localInput)
                }`
    } else {
        template =
            template +
            `
                {
                  "version": "2017-02-28",
                  "operation": "Invoke",
                  "payload": $util.toJson($ctx.stash.input)
                }`
    }
    //console.log('LLLLL: ', template)

    return {
        Resources: {
            /**
             * Log Group
             */
            [`Lambda${props.name}${props.stage}LogGroup`]: {
                Type: 'AWS::Logs::LogGroup',
                Properties: {
                    LogGroupName: `/aws/lambda/${props.appName}-${props.name}-${props.stage}`
                }
            },

            /**
             * Lambda Function
             * and Role
             */
            [`Lambda${props.name}${props.stage}`]: {
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
            [`Lambda${props.name}${props.stage}Role`]: {
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
                            PolicyName: `Lambda${props.appName}${props.name}${props.stage}RolePolicy`,
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
                                    },
                                    ...permissions.map((x) => ({
                                        Effect: 'Allow',
                                        Action: x.Action,
                                        Resource: x.Resource
                                    }))
                                ]
                            }
                        }
                    ],
                    Path: '/',
                    RoleName: `Lambda${props.appName}${props.name}${props.stage}Role`
                }
            },
            /**
             * Lambda Function Datasource
             * and Role
             */
            [`Lambda${props.name}${props.stage}Datasource`]: {
                Type: 'AWS::AppSync::DataSource',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Name: `Lambda${props.name}${props.stage}Datasource`,
                    // Description: 'Main Lambda function',
                    Type: 'AWS_LAMBDA',
                    ServiceRoleArn: {
                        'Fn::GetAtt': [
                            `Lambda${props.name}${props.stage}DatasourceRole`,
                            'Arn'
                        ]
                    },
                    LambdaConfig: {
                        LambdaFunctionArn: {
                            'Fn::GetAtt': [
                                `Lambda${props.name}${props.stage}`,
                                'Arn'
                            ]
                        }
                    }
                },
                DependsOn: [`Lambda${props.name}${props.stage}`]
            },

            [`Lambda${props.name}${props.stage}DatasourceRole`]: {
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
                            PolicyName: `Lambda${props.appName}${props.name}${props.stage}DatasourceRolePolicy`,
                            PolicyDocument: {
                                Version: '2012-10-17',
                                Statement: [
                                    {
                                        Action: ['lambda:invokeFunction'],
                                        Effect: 'Allow',
                                        Resource: [
                                            {
                                                'Fn::GetAtt': [
                                                    `Lambda${props.name}${props.stage}`,
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
            ['FunctionLambda' + props.name]: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: `Lambda${props.name}${props.stage}Datasource`,
                    FunctionVersion: '2018-05-29',
                    Name: 'functionLambda' + props.name,
                    RequestMappingTemplate: template,
                    ResponseMappingTemplate: `
                        $util.toJson($ctx.result)
                    `
                },
                DependsOn: [
                    `Lambda${props.name}${props.stage}Datasource`,
                    'GraphQlSchema'
                ]
            }
        },
        Outputs: {}
    }
}
