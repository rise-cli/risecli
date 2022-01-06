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

    if (value?.startsWith('$') && !value?.startsWith('${')) {
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

    let final = ``

    if (partitionKey.includes('{') && partitionKey.includes('}')) {
        let stringToUse = ''
        let replaceText: any = []
        let replaceIndex = -1

        let replace = false
        partitionKey.split('').forEach((ch: any, i: number, l: any) => {
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

        final = final + `#set ($${pkMode}Value = ${stringToUse})`
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
            } else {
                value = `"${value}"`
            }

            final =
                final +
                `#set ($${pkMode}Value= $util.str.toReplace($${pkMode}Value , "${original}", ${value}))`

            partitionKey = `$${pkMode}Value`
        })
    }

    if (sk.includes('{') && sk.includes('}')) {
        let stringToUse = ''
        let replaceText: any = []
        let replaceIndex = -1

        let replace = false
        sk.split('').forEach((ch: any, i: number, l: any) => {
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

        final = final + `#set ($skValue = ${stringToUse})`
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
            } else {
                value = `"${value}"`
            }

            final =
                final +
                `#set ($skValue= $util.str.toReplace($skValue , "${original}", ${value}))`

            sk = `$skValue`
        })
    }

    const requestTemplate = `
                {
                  "version": "2017-02-28",
                  "operation": "GetItem",
                  "key": {
                     "${pkMode}" : $util.dynamodb.toDynamoDBJson(${partitionKey}),
                     "sk" : $util.dynamodb.toDynamoDBJson(${sk})
                  },
                }`
    final = final + requestTemplate

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
                    RequestMappingTemplate: final,
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
