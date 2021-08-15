export default function schema({ schema }: { schema: string }) {
    return {
        Resources: {
            GraphQlSchema: {
                Type: 'AWS::AppSync::GraphQLSchema',
                Properties: {
                    Definition: schema,
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    }
                }
            }
        },
        Outputs: {}
    }
}
