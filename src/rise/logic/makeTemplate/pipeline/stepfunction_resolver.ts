export function makeStepFunctionResolver({
    apiName,
    definition
}: {
    apiName: string
    definition: any
}) {
    const def = JSON.stringify(definition)
    return {
        Resources: {
            SyncStateMachine4621AB31: {
                Type: 'AWS::StepFunctions::StateMachine',
                Properties: {
                    RoleArn: {
                        'Fn::GetAtt': ['SyncStateMachineRoleAE190D90', 'Arn']
                    },
                    DefinitionString: def,
                    StateMachineType: 'EXPRESS'
                },
                DependsOn: ['SyncStateMachineRoleAE190D90']
            },
            SyncStateMachineRoleAE190D90: {
                Type: 'AWS::IAM::Role',
                Properties: {
                    AssumeRolePolicyDocument: {
                        Statement: [
                            {
                                Action: 'sts:AssumeRole',
                                Effect: 'Allow',
                                Principal: {
                                    Service: {
                                        'Fn::Join': [
                                            '',
                                            [
                                                'states.',
                                                {
                                                    Ref: 'AWS::Region'
                                                },
                                                '.amazonaws.com'
                                            ]
                                        ]
                                    }
                                }
                            }
                        ],
                        Version: '2012-10-17'
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
