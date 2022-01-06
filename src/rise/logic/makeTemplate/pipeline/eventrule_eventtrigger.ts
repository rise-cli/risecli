export function makeEventRule({
    key,
    apiName,
    eventBus,
    eventSource,
    eventName,
    index
}: {
    key: string
    apiName: string
    eventName: string
    index: number
    eventBus: string
    eventSource: string
}) {
    return {
        Resources: {
            [`EventListener${apiName}${key}${eventName}${index}`]: {
                Type: 'AWS::Events::Rule',
                Properties: {
                    EventBusName: eventBus,
                    EventPattern: {
                        source: [`custom.${eventSource}`],
                        'detail-type': [eventName]
                    },
                    Targets: [
                        {
                            Arn: {
                                'Fn::GetAtt': [
                                    `TriggerSubscriptionFunction${apiName}${key}${eventName}${index}`,
                                    'Arn'
                                ]
                            },
                            Id: `EventListener${apiName}${key}${eventName}${index}`
                        }
                    ]
                }
            },

            [`EventRuleRole${apiName}${key}${eventName}${index}`]: {
                Type: 'AWS::Lambda::Permission',
                Properties: {
                    FunctionName: {
                        'Fn::GetAtt': [
                            `TriggerSubscriptionFunction${apiName}${key}${eventName}${index}`,
                            'Arn'
                        ]
                    },
                    Action: 'lambda:InvokeFunction',
                    Principal: 'events.amazonaws.com',
                    SourceArn: {
                        'Fn::GetAtt': [
                            `EventListener${apiName}${key}${eventName}${index}`,
                            'Arn'
                        ]
                    }
                }
            }
        },
        Outputs: {}
    }
}
