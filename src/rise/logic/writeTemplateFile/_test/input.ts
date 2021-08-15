export default {
    Resources: {
        GraphQlApi: {
            Type: 'AWS::AppSync::GraphQLApi',
            Properties: {
                Name: 'example2',
                XrayEnabled: false,
                AuthenticationType: 'API_KEY',
                AdditionalAuthenticationProviders: [
                    {
                        AuthenticationType: 'AWS_IAM'
                    }
                ]
            }
        },
        GraphQlSchema: {
            Type: 'AWS::AppSync::GraphQLSchema',
            Properties: {
                Definition:
                    'type Note {\n  pk: String\n  sk: String\n  name: String\n}\n\ninput NoteInput {\n  pk: String\n  sk: String\n  name: String\n}\n\ntype Query {\n  notes: [Note]\n}\n\ninput TestingInput {\n  id: String\n}\n\ntype Mutation {\n  createNote(input: NoteInput): Note\n  removeNote(pk: String, sk: String): Note\n}\n\nschema {\n  query: Query\n  mutation: Mutation\n}',
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
                Expires: 1627859769
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
                    TableName: 'example2',
                    AwsRegion: 'us-east-2'
                },
                ServiceRoleArn: {
                    'Fn::GetAtt': ['DbDatasourceRole', 'Arn']
                }
            }
        },
        DbDatasourceRole: {
            Type: 'AWS::IAM::Role',
            Properties: {
                RoleName: 'example2-dynamodb-policy',
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
                        PolicyName: 'example2PolicyDynamoDB',
                        PolicyDocument: {
                            Version: '2012-10-17',
                            Statement: [
                                {
                                    Effect: 'Allow',
                                    Action: ['dynamodb:*'],
                                    Resource: [
                                        {
                                            'Fn::Sub': [
                                                'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/example2',
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
                TableName: 'example2',
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
                            SigningRegion: 'us-east-2',
                            SigningServiceName: 'events'
                        }
                    },
                    Endpoint: 'https://events.us-east-2.amazonaws.com/'
                },
                ServiceRoleArn: {
                    'Fn::GetAtt': ['EventDatasourceRole', 'Arn']
                }
            }
        },
        EventDatasourceRole: {
            Type: 'AWS::IAM::Role',
            Properties: {
                RoleName: 'example2-eventds-policy',
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
                        PolicyName: 'example2PolicyEventDS',
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
        FunctionQuery: {
            Type: 'AWS::AppSync::FunctionConfiguration',
            Properties: {
                ApiId: {
                    'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                },
                DataSourceName: 'DbDatasource',
                FunctionVersion: '2018-05-29',
                Name: 'functionQuery',
                RequestMappingTemplate:
                    '\n                {\n                  "version": "2017-02-28",\n                  "operation" : "Query",\n                    "query" : {\n                        "expression" : "pk = :pk AND begins_with(sk, :sk)",\n                        "expressionValues" : {\n                            ":pk" : $util.dynamodb.toDynamoDBJson($context.stash.input.pk),\n                            ":sk" : $util.dynamodb.toDynamoDBJson($context.stash.input.sk)\n                        }\n                    }\n                }',
                ResponseMappingTemplate:
                    '\n                    $util.qr($ctx.stash.put("dbresult", $ctx.result.items))\n                    $util.toJson($ctx.result.items)\n                '
            },
            DependsOn: ['DbDatasource', 'GraphQlSchema']
        },
        PipelineQuerynotes: {
            Type: 'AWS::AppSync::Resolver',
            Properties: {
                ApiId: {
                    'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                },
                FieldName: 'notes',
                Kind: 'PIPELINE',
                PipelineConfig: {
                    Functions: [
                        {
                            'Fn::GetAtt': ['FunctionQuery', 'FunctionId']
                        }
                    ]
                },
                RequestMappingTemplate:
                    '\n            #if($util.isNullOrEmpty($ctx.args.input))\n                $util.qr($ctx.stash.put("input", {}))\t\n            #else\n                $util.qr($ctx.stash.put("input", $ctx.args.input))\n            #end\n    \n             {}',
                ResponseMappingTemplate:
                    '\n            #if($ctx.stash.dbresult)\n                $util.toJson($ctx.stash.dbresult)\n                \n            #else\n                $util.error("event branch")\n                $ctx.stash.eventresult\n            #end\n                ',
                TypeName: 'Query'
            },
            DependsOn: ['DbDatasource', 'GraphQlSchema']
        },
        FunctionSet: {
            Type: 'AWS::AppSync::FunctionConfiguration',
            Properties: {
                ApiId: {
                    'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                },
                DataSourceName: 'DbDatasource',
                FunctionVersion: '2018-05-29',
                Name: 'functionSet',
                RequestMappingTemplate:
                    '\n                    {\n                        "version": "2017-02-28",\n                        "operation": "PutItem",\n                        "key": {\n                            "pk": $util.dynamodb.toDynamoDBJson($context.stash.input.pk),\n                            "sk": $util.dynamodb.toDynamoDBJson($context.stash.input.sk)\n                        },\n                        "attributeValues": $util.dynamodb.toMapValuesJson($context.stash.input)\n                    }',
                ResponseMappingTemplate:
                    '\n                        $util.qr($ctx.stash.put("dbresult", $ctx.result))\n                        $util.toJson($ctx.result)\n                    '
            },
            DependsOn: ['DbDatasource', 'GraphQlSchema']
        },
        PipelineMutationcreateNote: {
            Type: 'AWS::AppSync::Resolver',
            Properties: {
                ApiId: {
                    'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                },
                FieldName: 'createNote',
                Kind: 'PIPELINE',
                PipelineConfig: {
                    Functions: [
                        {
                            'Fn::GetAtt': ['FunctionSet', 'FunctionId']
                        }
                    ]
                },
                RequestMappingTemplate:
                    '\n            #if($util.isNullOrEmpty($ctx.args.input))\n                $util.qr($ctx.stash.put("input", {}))\t\n            #else\n                $util.qr($ctx.stash.put("input", $ctx.args.input))\n            #end\n               $util.qr($ctx.stash.input.put("sk", $util.str.toReplace("note_@id", "@id", $util.autoId())))            $util.qr($ctx.stash.input.put("other", "sub")) \n             {}',
                ResponseMappingTemplate:
                    '\n                #if($ctx.stash.dbresult)\n                  $util.toJson($ctx.stash.dbresult)   \n                #else\n                    $util.toJson($ctx.args)\n                    ## $ctx.stash.eventresult\n                #end\n                ',
                TypeName: 'Mutation'
            },
            DependsOn: ['DbDatasource', 'GraphQlSchema']
        },
        FunctionRemove: {
            Type: 'AWS::AppSync::FunctionConfiguration',
            Properties: {
                ApiId: {
                    'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                },
                DataSourceName: 'DbDatasource',
                FunctionVersion: '2018-05-29',
                Name: 'functionRemove',
                RequestMappingTemplate:
                    '\n                    {\n                        "version": "2017-02-28",\n                        "operation": "DeleteItem",\n                        "key": {\n                            "pk": $util.dynamodb.toDynamoDBJson($context.stash.input.pk),\n                            "sk": $util.dynamodb.toDynamoDBJson($context.stash.input.sk)\n                        }\n                    }',
                ResponseMappingTemplate:
                    '\n                       $util.qr($ctx.stash.put("dbresult", $ctx.result))\n                        $util.toJson($ctx.result)\n                    '
            },
            DependsOn: ['DbDatasource', 'GraphQlSchema']
        },
        PipelineMutationremoveNote: {
            Type: 'AWS::AppSync::Resolver',
            Properties: {
                ApiId: {
                    'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                },
                FieldName: 'removeNote',
                Kind: 'PIPELINE',
                PipelineConfig: {
                    Functions: [
                        {
                            'Fn::GetAtt': ['FunctionRemove', 'FunctionId']
                        }
                    ]
                },
                RequestMappingTemplate:
                    '\n            #if($util.isNullOrEmpty($ctx.args.input))\n                $util.qr($ctx.stash.put("input", {}))\t\n            #else\n                $util.qr($ctx.stash.put("input", $ctx.args.input))\n            #end\n    \n             {}',
                ResponseMappingTemplate:
                    '\n                #if($ctx.stash.dbresult)\n                  $util.toJson($ctx.stash.dbresult)   \n                #else\n                    $util.toJson($ctx.args)\n                    ## $ctx.stash.eventresult\n                #end\n                ',
                TypeName: 'Mutation'
            },
            DependsOn: ['DbDatasource', 'GraphQlSchema']
        },
        TriggerSubscriptionFunctionexample2processCompleteda: {
            Type: 'AWS::Lambda::Function',
            Properties: {
                Runtime: 'nodejs12.x',
                Handler: 'index.handler',
                Role: {
                    'Fn::GetAtt': [
                        'TriggerSubscriptionRoleexample2processCompleteda',
                        'Arn'
                    ]
                },
                Code: {
                    ZipFile:
                        '\n            const env = require("process").env;\n            const AWS = require("aws-sdk");\n            const URL = require("url");\n            const https = require(\'https\');\n\n            AWS.config.update({\n            region: process.env.REGION,\n            credentials: new AWS.Credentials(\n                env.AWS_ACCESS_KEY_ID,\n                env.AWS_SECRET_ACCESS_KEY,\n                env.AWS_SESSION_TOKEN\n            ),\n            });\n\n            module.exports.handler = (props) => {\n                //const input = JSON.parse(props)\n                const body = {\n                    query: `\n                        mutation createNote($input: CompleteInput) {\n                            completeProcess(input: $input)\n                        }\n                    `,\n                    variables: {\n                        input: {pk: props.detail.pk,sk: props.detail.sk,status: props.detail.status}\n                    }\n                }\n                const uri = URL.parse(process.env.ENDPOINT);\n                const httpRequest = new AWS.HttpRequest(uri.href, process.env.REGION);\n                httpRequest.headers.host = uri.host;\n                httpRequest.headers["Content-Type"] = "application/json";\n                httpRequest.method = "POST";\n                httpRequest.body = JSON.stringify(body);\n\n                const signer = new AWS.Signers.V4(httpRequest, "appsync", true);\n                signer.addAuthorization(AWS.config.credentials, AWS.util.date.getDate());\n\n                const options = {\n                    hostname: uri.href.slice(8, uri.href.length - 8),\n                    path: \'/graphql\',\n                    method: httpRequest.method,\n                    body: httpRequest.body,\n                    headers: httpRequest.headers,\n                };\n\n                const req = https.request(options, res => {\n\n                res.on(\'data\', d => {\n                        process.stdout.write(d)\n                    })\n                })\n\n                req.on(\'error\', error => {\n                    console.error(error.message)\n                })\n\n                req.write(JSON.stringify(body))\n                req.end()\n            }'
                },
                Environment: {
                    Variables: {
                        REGION: {
                            'Fn::Sub': ['${AWS::Region}', {}]
                        },
                        ENDPOINT: {
                            'Fn::GetAtt': ['GraphQlApi', 'GraphQLUrl']
                        }
                    }
                }
            }
        },
        TriggerSubscriptionRoleexample2processCompleteda: {
            Type: 'AWS::IAM::Role',
            Properties: {
                RoleName: 'TriggerSubscriptionRoleexample2processCompleteda',
                AssumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Action: ['sts:AssumeRole'],
                            Principal: {
                                Service: ['lambda.amazonaws.com']
                            }
                        }
                    ]
                },
                Policies: [
                    {
                        PolicyName: 'TriggerSubscriptionPolicyexample2',
                        PolicyDocument: {
                            Version: '2012-10-17',
                            Statement: [
                                {
                                    Effect: 'Allow',
                                    Action: ['appsync:GraphQL'],
                                    Resource: [
                                        {
                                            'Fn::Join': [
                                                '',
                                                [
                                                    {
                                                        'Fn::GetAtt': [
                                                            'GraphQlApi',
                                                            'Arn'
                                                        ]
                                                    },
                                                    '/types/*'
                                                ]
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
        EventListenerexample2processCompleteda: {
            Type: 'AWS::Events::Rule',
            Properties: {
                EventBusName: 'default',
                EventPattern: {
                    source: ['custom.accounting'],
                    'detail-type': ['processCompleted']
                },
                Targets: [
                    {
                        Arn: {
                            'Fn::GetAtt': [
                                'TriggerSubscriptionFunctionexample2processCompleteda',
                                'Arn'
                            ]
                        },
                        Id: 'EventListenerexample2processCompleteda'
                    }
                ]
            }
        },
        EventRuleRoleexample2processCompleteda: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
                FunctionName: {
                    'Fn::GetAtt': [
                        'TriggerSubscriptionFunctionexample2processCompleteda',
                        'Arn'
                    ]
                },
                Action: 'lambda:InvokeFunction',
                Principal: 'events.amazonaws.com',
                SourceArn: {
                    'Fn::GetAtt': [
                        'EventListenerexample2processCompleteda',
                        'Arn'
                    ]
                }
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
        }
    }
}
