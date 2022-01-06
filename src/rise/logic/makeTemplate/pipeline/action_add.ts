export function buildRequestTemplate(config: any) {
    let requestTemplate = `
            #if($util.isNullOrEmpty($ctx.args.input))
                $util.qr($ctx.stash.put("input", {}))	
            #else
                $util.qr($ctx.stash.put("input", $ctx.args.input))
            #end
    `
    Object.keys(config).forEach((k) => {
        // Starts With
        let value = config[k]

        //@now: $util.time.nowEpochMilliSeconds()

        //@today: $util.time.nowFormatted("yyyy-MM-dd")

        if (value.startsWith('@now')) {
            value = value.replace('@now', '$util.time.nowEpochMilliSeconds()')
        } else if (value.startsWith('#userId')) {
            value = value.replace('#userId', '$ctx.stash.userId')
        } else if (value.startsWith('#userPassword')) {
            value = value.replace('#userPassword', '$ctx.stash.userPassword')
        } else if (value.startsWith('$')) {
            value = value.replace('$', '$ctx.args.input.')
        } else if (value.startsWith('!')) {
            value = value.replace('!', '$ctx.identity.claims.')
        } else if (value.startsWith('<')) {
            value = value.replace('<', '$ctx.prev.result.')
        } else {
            value = `"${value}"`
        }

        // Contains Replace
        if (value.includes('{') && value.includes('}')) {
            let stringToUse = ''
            let replaceText: any = []
            let replaceIndex = -1

            let replace = false
            value.split('').forEach((ch: any, i: number, l: any) => {
                if (l[i] === '{') {
                    replaceIndex++
                    replace = true
                } else if (l[i] === '}') {
                    replace = false
                } else {
                    stringToUse = stringToUse + ch
                    if (replace) {
                        if (!replaceText[replaceIndex]) {
                            replaceText[replaceIndex] = ch
                        } else {
                            replaceText[replaceIndex] =
                                replaceText[replaceIndex] + ch
                        }
                    }
                }
            })

            requestTemplate =
                requestTemplate + `#set ($${k}Value = ${stringToUse})`
            replaceText.forEach((value: string) => {
                let original = value
                if (value.startsWith('#userId')) {
                    value = value.replace('#userId', '$ctx.stash.userId')
                } else if (value.startsWith('#userPassword')) {
                    value = value.replace(
                        '#userPassword',
                        '$ctx.stash.userPassword'
                    )
                } else if (value.startsWith('$')) {
                    value = value.replace('$', '$ctx.args.input.')
                } else if (value.startsWith('!')) {
                    value = value.replace('!', '$ctx.identity.claims.')
                } else if (value.startsWith('<')) {
                    value = value.replace('<', '$ctx.prev.result.')
                } else {
                    value = `"${value}"`
                }

                requestTemplate =
                    requestTemplate +
                    `#set ($${k}Value= $util.str.toReplace($${k}Value , "${original}", ${value}))`
            })

            value = `$${k}Value`
        }
        /* 
        #set ($str = "..@a..@b..@c")
#set ($str = $util.str.toReplace($str , "@a", "1"))
#set ($str = $util.str.toReplace($str , "@b", "2"))
*/

        // Replace
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

export function makeAddFunction(props: { name: string; config: any }) {
    return {
        Resources: {
            ['FunctionAdd' + props.name]: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'NoneDatasource',
                    FunctionVersion: '2018-05-29',
                    Name: 'FunctionAdd' + props.name,
                    RequestMappingTemplate: buildRequestTemplate(props.config),
                    ResponseMappingTemplate: `$util.toJson({})`
                },
                DependsOn: ['NoneDatasource', 'GraphQlSchema']
            }
        },
        Outputs: {}
    }
}
