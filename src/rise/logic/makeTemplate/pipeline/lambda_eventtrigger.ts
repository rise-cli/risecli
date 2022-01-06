export function buildEventInput(eventInput: any) {
    let v = '{'
    Object.keys(eventInput).forEach((k: string, i) => {
        v = v + `${k}: props.${eventInput[k]}`
        if (Object.keys(eventInput).length > i + 1) {
            v = v + ','
        }
    })

    v = v + '}'
    return v
}

export function makeLambdaEventTrigger({
    key,
    apiName,
    eventName,
    index,
    query,
    eventInput
}: {
    key: string
    apiName: string
    eventName: string
    index: number
    query: string
    eventInput: any
}) {
    let value = buildEventInput(eventInput)

    const code = `
            const env = require("process").env;
            const AWS = require("aws-sdk");
            const URL = require("url");
            const https = require('https');

            AWS.config.update({
            region: process.env.REGION,
            credentials: new AWS.Credentials(
                env.AWS_ACCESS_KEY_ID,
                env.AWS_SECRET_ACCESS_KEY,
                env.AWS_SESSION_TOKEN
            ),
            });

            module.exports.handler = (props) => {
                const body = {
                    query: \`${query}\`,
                    variables: {
                        input: ${value}
                    }
                }
                const uri = URL.parse(process.env.ENDPOINT);
                const httpRequest = new AWS.HttpRequest(uri.href, process.env.REGION);
                httpRequest.headers.host = uri.host;
                httpRequest.headers["Content-Type"] = "application/json";
                httpRequest.method = "POST";
                httpRequest.body = JSON.stringify(body);

                const signer = new AWS.Signers.V4(httpRequest, "appsync", true);
                signer.addAuthorization(AWS.config.credentials, AWS.util.date.getDate());

                const options = {
                    hostname: uri.href.slice(8, uri.href.length - 8),
                    path: '/graphql',
                    method: httpRequest.method,
                    body: httpRequest.body,
                    headers: httpRequest.headers,
                };

                const req = https.request(options, res => {

                res.on('data', d => {
                        process.stdout.write(d)
                    })
                })

                req.on('error', error => {
                    console.error(error.message)
                })

                req.write(JSON.stringify(body))
                req.end()
            }`

    return {
        Resources: {
            [`TriggerSubscriptionFunction${apiName}${key}${eventName}${index}`]:
                {
                    Type: 'AWS::Lambda::Function',
                    Properties: {
                        Runtime: 'nodejs12.x',
                        Handler: 'index.handler',
                        Role: {
                            'Fn::GetAtt': [
                                `TriggerSubscriptionRole${apiName}${key}${eventName}${index}`,
                                'Arn'
                            ]
                        },
                        Code: {
                            ZipFile: code
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
            [`TriggerSubscriptionRole${apiName}${key}${eventName}${index}`]: {
                Type: 'AWS::IAM::Role',
                Properties: {
                    RoleName: `TriggerSubscriptionRole${apiName}${key}${eventName}${index}`,
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
                            PolicyName: `TriggerSubscriptionPolicy${apiName}`,
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
            }
        },
        Outputs: {}
    }
}
