export function makeEventRule({
    apiName,
    eventBus,
    eventSource,
    eventName,
    index
}: {
    apiName: string
    eventName: string
    index: number
    eventBus: string
    eventSource: string
}) {
    return {
        Resources: {
            [`EventListener${apiName}${eventName}${index}`]: {
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
                                    `TriggerSubscriptionFunction${apiName}${eventName}${index}`,
                                    'Arn'
                                ]
                            },
                            Id: `EventListener${apiName}${eventName}${index}`
                        }
                    ]
                }
            },

            [`EventRuleRole${apiName}${eventName}${index}`]: {
                Type: 'AWS::Lambda::Permission',
                Properties: {
                    FunctionName: {
                        'Fn::GetAtt': [
                            `TriggerSubscriptionFunction${apiName}${eventName}${index}`,
                            'Arn'
                        ]
                    },
                    Action: 'lambda:InvokeFunction',
                    Principal: 'events.amazonaws.com',
                    SourceArn: {
                        'Fn::GetAtt': [
                            `EventListener${apiName}${eventName}${index}`,
                            'Arn'
                        ]
                    }
                }
            }
        },
        Outputs: {}
    }
}
