export default function makeNoneDatasource() {
    return {
        Resources: {
            NoneDatasource: {
                Type: 'AWS::AppSync::DataSource',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Name: 'NoneDatasource',
                    Type: 'NONE'
                }
            }
        },
        Outputs: {}
    }
}
