import {
    makeDbGetFunction,
    makeQueryDbFunction,
    makeSetDbFunction,
    makeRemoveDbFunction
} from './action_db'

test('makeDbGetFunction will make CF JSON for db get vtl function', () => {
    const result = makeDbGetFunction()

    expect(result).toEqual({
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
    })
})

test('makeQueryDbFunction will make CF JSON for db query vtl function', () => {
    const result = makeQueryDbFunction()

    expect(result).toEqual({
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
    })
})

test('makeCreateDbFunction will make CF JSON for db set vtl function', () => {
    const result = makeSetDbFunction()

    expect(result).toEqual({
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
    })
})

test('makeRemoveDbFunction will make CF JSON for db remove vtl function', () => {
    const result = makeRemoveDbFunction()

    expect(result).toEqual({
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
    })
})
