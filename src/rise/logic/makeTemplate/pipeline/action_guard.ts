type GuardInput = {
    path?: string
    field: string
    index: number
    config: {
        pk?: string
        pk2?: string
        pk3?: string
        sk: string
    }
}

export function setKey(value: string) {
    const path = '$ctx.args.input.'
    const cogPath = '$ctx.identity.claims.'

    if (value?.startsWith('$')) {
        return value.replace('$', path)
    } else if (value?.startsWith('!')) {
        return value.replace('!', cogPath)
    } else {
        return `"${value}"`
    }
}

export function makeGuardFunction(props: GuardInput) {
    let pkMode = 'pk'
    let partitionKey = 'pk'

    if (props.config.pk) {
        pkMode = 'pk'
        partitionKey = setKey(props.config.pk)
    }

    if (props.config.pk2) {
        pkMode = 'pk2'
        partitionKey = setKey(props.config.pk2)
    }

    if (props.config.pk3) {
        pkMode = 'pk3'
        partitionKey = setKey(props.config.pk3)
    }

    let sk = setKey(props.config.sk)

    return {
        Resources: {
            [`FunctionGaurd${props.field}${props.index}`]: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'DbDatasource',
                    FunctionVersion: '2018-05-29',
                    Name: `FunctionGaurd${props.field}${props.index}`,
                    RequestMappingTemplate: `
                {
                  "version": "2017-02-28",
                  "operation": "GetItem",
                  "key": {
                     "${pkMode}" : $util.dynamodb.toDynamoDBJson(${partitionKey}),
                     "sk" : $util.dynamodb.toDynamoDBJson(${sk})
                  },
                }`,

                    ResponseMappingTemplate: `
                    #if(!$ctx.result)
                        $util.error("Unauthorized")
                    #else
                        $util.toJson($ctx.result)
                    #end    
                `
                },
                DependsOn: ['DbDatasource', 'GraphQlSchema']
            }
        }
    }
}
