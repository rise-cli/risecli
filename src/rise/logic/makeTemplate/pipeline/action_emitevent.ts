export function buildEventDetailInput(input: any) {
    let detail = `"{`
    Object.keys(input).forEach((x, i, array) => {
        let value = input[x].toString()

        if (value.startsWith('$')) {
            value = value.replace('$', '$ctx.args.input.')
        }

        if (value.startsWith('!')) {
            value = value.replace('!', '$ctx.identity.claims.')
        }

        if (value.startsWith('#')) {
            value = value.replace('#', '$ctx.stash.dbresult.')
        }

        const EVENT_QUOTE = 'RISE_EVENT_QUOTE'
        detail =
            detail +
            `${EVENT_QUOTE}${x}${EVENT_QUOTE}: ${EVENT_QUOTE}${value}${EVENT_QUOTE}`

        if (i + 1 < array.length) {
            detail = detail + ','
        }
    })
    detail = detail + `}"`
    return detail
}

export function makeEmitEvent(props: any) {
    let detail = buildEventDetailInput(props.config.detail)
    return {
        Resources: {
            [`FunctionEmit${props.name}`]: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'EventBridgeDataSource',
                    FunctionVersion: '2018-05-29',
                    Name: `FunctionEmit${props.name}`,
                    RequestMappingTemplate: `
                    {
                        "version": "2018-05-29",
                        "method": "POST",
                        "resourcePath": "/",
                        "params": {
                        "headers": {
                            "content-type": "application/x-amz-json-1.1",
                            "x-amz-target":"AWSEvents.PutEvents"
                        },
                        "body": {
                            "Entries":[ 
                                    {
                                        "Source":"custom.${props.config.source}",
                                        "EventBusName": "${props.config.eventBus}",
                                        "Detail": ${detail},
                                        "DetailType":"${props.config.event}"
                                    }
                                ]
                            }
                        }
                    }`,
                    ResponseMappingTemplate: `
                    #if($ctx.error)
                        $util.error($ctx.error.message, $ctx.error.type)
                    #end
   
                    #if($ctx.result.statusCode == 200)
                        $util.qr($ctx.stash.put("eventresult", $ctx.result.body))
                        ## If response is 200, return the body.
                        {
                            "result": "$util.parseJson($ctx.result.body)"
                        }    
                    #else
                        $utils.appendError($ctx.result.body, $ctx.result.statusCode)
                    #end`
                },
                DependsOn: ['EventBridgeDataSource', 'GraphQlSchema']
            }
        }
    }
}
