import { makeInput } from './_utils/makeInput'

/**
 *Need to edit this to send cognito add user payload
 *
 *
 */

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

export function makeAddUser(props: any) {
    const template = makeInput({
        email: props.email
    })
    //let detail = buildEventDetailInput(props.config.detail)
    return {
        Resources: {
            [`FunctionCognitoAdd`]: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'CognitoDataSource',
                    FunctionVersion: '2018-05-29',
                    Name: `FunctionCognitoAdd`,
                    RequestMappingTemplate: {
                        'Fn::Sub': [
                            `${template}
                    #set ($pass = $util.autoId().split("-")[0])
                    #set ($pass2 = "@C")
                    #set ($pass3 = $util.autoId().split("-")[0])
                    #set ($tempPass = "$pass$pass2$pass3")
                    #if($util.isNullOrEmpty($ctx.args.input))
                        $util.qr($ctx.stash.put("input", {}))	
                    #end
                    $util.qr($ctx.stash.input.put("temporaryPassword","$tempPass"))
                    {
                        "version": "2018-05-29",
                        "method": "POST",
                        "resourcePath": "/",
                        "params": {
                            "headers": {
                                "content-type": "application/x-amz-json-1.1",
                                "x-amz-target":"AWSCognitoIdentityProviderService.AdminCreateUser"
                            },
                            "body": {
                                "UserPoolId": "\${Id}",
                                "Username": "$context.stash.localInput.email",
                                "TemporaryPassword": "$tempPass",
                                "MessageAction": "SUPPRESS",
                                "UserAttributes": [
                                    {
                                        "Name": "name",
                                        "Value": "$context.stash.localInput.email"
                                    },
                                    {
                                        "Name": "email",
                                        "Value": "$context.stash.localInput.email"
                                    },
                                    {
                                        "Name": "email_verified",
                                        "Value": "True"
                                    }
                                ]
                            }
                        }
                    }`,
                            {
                                Id: {
                                    Ref: 'CognitoUserPoolMyUserPool'
                                }
                            }
                        ]
                    },
                    ResponseMappingTemplate: `
                    #if($ctx.error)
                        $util.error($ctx.error.message, $ctx.error.type)
                    #end
   
                    #if($ctx.result.statusCode == 200)
                        
                        $util.qr($ctx.stash.input.put("userId", $util.parseJson($ctx.result.body).User.Username))
                        $util.toJson({})   
                    #else
                        $utils.appendError($ctx.result.body, $ctx.result.statusCode)
                    #end`
                },
                DependsOn: ['CognitoDataSource', 'GraphQlSchema']
            }
        },
        Outputs: {}
    }
}

export function makeDeleteUser(props: any) {
    //let detail = buildEventDetailInput(props.config.detail)
    return {
        Resources: {
            [`FunctionCognitoDelete`]: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'CognitoDataSource',
                    FunctionVersion: '2018-05-29',
                    Name: `FunctionCognitoAdd`,
                    RequestMappingTemplate: {
                        'Fn::Sub': [
                            `
                 
                    {
                        "version": "2018-05-29",
                        "method": "POST",
                        "resourcePath": "/",
                        "params": {
                            "headers": {
                                "content-type": "application/x-amz-json-1.1",
                                "x-amz-target":"AWSCognitoIdentityProviderService.AdminDeleteUser"
                            },
                            "body": {
                                "UserPoolId": "\${Id}",
                                "Username": "$context.stash.input.email"
                            }
                        }
                    }`,
                            {
                                Id: {
                                    Ref: 'CognitoUserPoolMyUserPool'
                                }
                            }
                        ]
                    },
                    ResponseMappingTemplate: `
                    #if($ctx.error)
                        $util.error($ctx.error.message, $ctx.error.type)
                    #end
   
                    #if($ctx.result.statusCode == 200)
                        $util.qr($ctx.stash.put("userId", $util.parseJson($ctx.result.body).User.Username))
                        $util.toJson({})   
                    #else
                        $utils.appendError($ctx.result.body, $ctx.result.statusCode)
                    #end`
                },
                DependsOn: ['CognitoDataSource', 'GraphQlSchema']
            }
        },
        Outputs: {}
    }
}
