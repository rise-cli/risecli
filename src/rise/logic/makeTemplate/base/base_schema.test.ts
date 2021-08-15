import makeSchema from './base_schema'

test('makeDb will make CF JSON for dynamodb table', () => {
    const result = makeSchema({
        schema: 'SCEHMA'
    })

    expect(result).toEqual({
        Resources: {
            GraphQlSchema: {
                Type: 'AWS::AppSync::GraphQLSchema',
                Properties: {
                    Definition: 'SCEHMA',
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    }
                }
            }
        },
        Outputs: {}
    })
})
