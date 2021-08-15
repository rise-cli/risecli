export function buildRequestTemplate(config: any) {
    let requestTemplate = `
            #if($util.isNullOrEmpty($ctx.args.input))
                $util.qr($ctx.stash.put("input", {}))	
            #else
                $util.qr($ctx.stash.put("input", $ctx.args.input))
            #end
    `

    Object.keys(config).forEach((k) => {
        let value = config[k]

        if (value.startsWith('$')) {
            value = value.replace('$', '$ctx.args.input.')
        } else if (value.startsWith('!')) {
            value = value.replace('!', '$ctx.identity.claims.')
        } else {
            value = `"${value}"`
        }

        if (value.includes('@id')) {
            requestTemplate =
                requestTemplate +
                `           $util.qr($ctx.stash.input.put("${k}", $util.str.toReplace(${value}, "@id", $util.autoId()))) `
        } else {
            requestTemplate =
                requestTemplate +
                `           $util.qr($ctx.stash.input.put("${k}", ${value})) `
        }
    })

    requestTemplate = requestTemplate + `\n             {}`
    return requestTemplate
}

export function makeMutationPipeline(props: any) {
    let requestTemplate = buildRequestTemplate(props.config)

    return {
        Resources: {
            [`PipelineMutation${props.field}`]: {
                Type: 'AWS::AppSync::Resolver',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    FieldName: props.field,
                    Kind: 'PIPELINE',
                    PipelineConfig: {
                        Functions: props.functions.map((x: string) => ({
                            'Fn::GetAtt': [x, 'FunctionId']
                        }))
                    },
                    RequestMappingTemplate: requestTemplate,
                    ResponseMappingTemplate: `
                #if($ctx.stash.dbresult)
                  $util.toJson($ctx.stash.dbresult)   
                #else
                    $util.toJson($ctx.args)
                    ## $ctx.stash.eventresult
                #end
                `,
                    TypeName: 'Mutation'
                },
                DependsOn: ['DbDatasource', 'GraphQlSchema']
            }
        },
        Outputs: {}
    }
}
