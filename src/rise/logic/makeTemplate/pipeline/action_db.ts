import { makeInput } from './_utils/makeInput'

export function makeDbGetFunction(config: any) {
    if (config.input) {
        let template = makeInput(config.input)
        template =
            template +
            `
                {
                  "version": "2017-02-28",
                  "operation": "GetItem",
                  "key": {
                        "pk": $util.dynamodb.toDynamoDBJson($context.stash.localInput.pk),
                        "sk": $util.dynamodb.toDynamoDBJson($context.stash.localInput.sk)
                  },
                }`
        return {
            Resources: {
                [`FunctionGet` + config.name]: {
                    Type: 'AWS::AppSync::FunctionConfiguration',
                    Properties: {
                        ApiId: {
                            'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                        },
                        DataSourceName: 'DbDatasource',
                        FunctionVersion: '2018-05-29',
                        Name: 'functionGet' + config.name,
                        RequestMappingTemplate: template,
                        ResponseMappingTemplate: `
                        $util.qr($ctx.stash.put("dbresult", $ctx.result))
                        $util.toJson($ctx.result)
                    `
                    },
                    DependsOn: ['DbDatasource', 'GraphQlSchema']
                }
            },
            Outputs: {}
        }
    }
    return {
        Resources: {
            FunctionGet: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'DbDatasource',
                    FunctionVersion: '2018-05-29',
                    Name: 'functionGet',
                    RequestMappingTemplate: `
                {
                  "version": "2017-02-28",
                  "operation": "GetItem",
                  "key": {
                     "pk" : $util.dynamodb.toDynamoDBJson($context.stash.input.pk),
                     "sk" : $util.dynamodb.toDynamoDBJson($context.stash.input.sk)
                  },
                }`,

                    ResponseMappingTemplate: `
                        $util.qr($ctx.stash.put("dbresult", $ctx.result))
                        $util.toJson($ctx.result)
                    `
                },
                DependsOn: ['DbDatasource', 'GraphQlSchema']
            }
        },
        Outputs: {}
    }
}

export function makeQueryDbFunction(config?: any) {
    if (config.input) {
        let template = makeInput(config.input)
        template =
            template +
            `
                {
                  "version": "2017-02-28",
                  "operation" : "Query",
                    "query" : {
                        "expression" : "pk = :pk AND begins_with(sk, :sk)",
                        "expressionValues" : {
                            ":pk": $util.dynamodb.toDynamoDBJson($context.stash.localInput.pk),
                            ":sk": $util.dynamodb.toDynamoDBJson($context.stash.localInput.sk)
                        }
                    }
                }`
        return {
            Resources: {
                [`FunctionQuery` + config.name]: {
                    Type: 'AWS::AppSync::FunctionConfiguration',
                    Properties: {
                        ApiId: {
                            'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                        },
                        DataSourceName: 'DbDatasource',
                        FunctionVersion: '2018-05-29',
                        Name: 'functionQuery' + config.name,
                        RequestMappingTemplate: template,
                        ResponseMappingTemplate: `
                    $util.qr($ctx.stash.put("dbresult", $ctx.result.items))
                    $util.toJson($ctx.result.items)
                `
                    },
                    DependsOn: ['DbDatasource', 'GraphQlSchema']
                }
            },
            Outputs: {}
        }
    }
    return {
        Resources: {
            FunctionQuery: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'DbDatasource',
                    FunctionVersion: '2018-05-29',
                    Name: 'functionQuery',
                    RequestMappingTemplate: `
                {
                  "version": "2017-02-28",
                  "operation" : "Query",
                    "query" : {
                        "expression" : "pk = :pk AND begins_with(sk, :sk)",
                        "expressionValues" : {
                            ":pk" : $util.dynamodb.toDynamoDBJson($context.stash.input.pk),
                            ":sk" : $util.dynamodb.toDynamoDBJson($context.stash.input.sk)
                        }
                    }
                }`,

                    ResponseMappingTemplate: `
                    $util.qr($ctx.stash.put("dbresult", $ctx.result.items))
                    $util.toJson($ctx.result.items)
                `
                },
                DependsOn: ['DbDatasource', 'GraphQlSchema']
            }
        },
        Outputs: {}
    }
}

export function makeSetDbFunction(config?: any) {
    if (config.input) {
        let template = makeInput(config.input)

        template =
            template +
            `
                    {
                        "version": "2017-02-28",
                        "operation": "PutItem",
                        "key": {
                            "pk": $util.dynamodb.toDynamoDBJson($context.stash.localInput.pk),
                            "sk": $util.dynamodb.toDynamoDBJson($context.stash.localInput.sk)
                        },
                        "attributeValues": $util.dynamodb.toMapValuesJson($context.stash.localInput)
                    }`

        return {
            Resources: {
                [`FunctionSet` + config.name]: {
                    Type: 'AWS::AppSync::FunctionConfiguration',
                    Properties: {
                        ApiId: {
                            'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                        },
                        DataSourceName: 'DbDatasource',
                        FunctionVersion: '2018-05-29',
                        Name: 'functionSet' + config.name,
                        RequestMappingTemplate: template,
                        ResponseMappingTemplate: `
                        $util.qr($ctx.stash.put("dbresult", $ctx.result))
                        $util.toJson($ctx.result)
                    `
                    },
                    DependsOn: ['DbDatasource', 'GraphQlSchema']
                }
            },
            Outputs: {}
        }
    }
    return {
        Resources: {
            FunctionSet: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'DbDatasource',
                    FunctionVersion: '2018-05-29',
                    Name: 'functionSet',
                    RequestMappingTemplate: `
                    {
                        "version": "2017-02-28",
                        "operation": "PutItem",
                        "key": {
                            "pk": $util.dynamodb.toDynamoDBJson($context.stash.input.pk),
                            "sk": $util.dynamodb.toDynamoDBJson($context.stash.input.sk)
                        },
                        "attributeValues": $util.dynamodb.toMapValuesJson($context.stash.input)
                    }`,

                    ResponseMappingTemplate: `
                        $util.qr($ctx.stash.put("dbresult", $ctx.result))
                        $util.toJson($ctx.result)
                    `
                },
                DependsOn: ['DbDatasource', 'GraphQlSchema']
            }
        },
        Outputs: {}
    }
}

export function makeRemoveDbFunction(config?: any) {
    if (config.input) {
        let template = makeInput(config.input)
        template =
            template +
            `
                    {
                        "version": "2017-02-28",
                        "operation": "PutItem",
                        "key": {
                            "pk": $util.dynamodb.toDynamoDBJson($context.stash.localInput.pk),
                            "sk": $util.dynamodb.toDynamoDBJson($context.stash.localInput.sk)
                        }
                    }`
        return {
            Resources: {
                [`FunctionRemove` + config.name]: {
                    Type: 'AWS::AppSync::FunctionConfiguration',
                    Properties: {
                        ApiId: {
                            'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                        },
                        DataSourceName: 'DbDatasource',
                        FunctionVersion: '2018-05-29',
                        Name: 'functionRemove' + config.name,
                        RequestMappingTemplate: template,

                        ResponseMappingTemplate: `
                       $util.qr($ctx.stash.put("dbresult", $ctx.result))
                        $util.toJson($ctx.result)
                    `
                    },
                    DependsOn: ['DbDatasource', 'GraphQlSchema']
                }
            },
            Outputs: {}
        }
    }
    return {
        Resources: {
            FunctionRemove: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'DbDatasource',
                    FunctionVersion: '2018-05-29',
                    Name: 'functionRemove',
                    RequestMappingTemplate: `
                    {
                        "version": "2017-02-28",
                        "operation": "DeleteItem",
                        "key": {
                            "pk": $util.dynamodb.toDynamoDBJson($context.stash.input.pk),
                            "sk": $util.dynamodb.toDynamoDBJson($context.stash.input.sk)
                        }
                    }`,

                    ResponseMappingTemplate: `
                       $util.qr($ctx.stash.put("dbresult", $ctx.result))
                        $util.toJson($ctx.result)
                    `
                },
                DependsOn: ['DbDatasource', 'GraphQlSchema']
            }
        },
        Outputs: {}
    }
}
