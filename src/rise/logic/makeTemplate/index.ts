import pipeline from './pipeline'
import base from './base/base'

export function createTemplate(rise: any, bucketArn?: string) {
    const b = base(rise)
    const p = pipeline(rise, bucketArn)
    return {
        Description: 'RISE_APP',
        // Metadata: {
        //     ...rise,
        //     order: {
        //         Query: Object.keys(rise.resolvers.Query),
        //         Mutation: Object.keys(rise.resolvers.Mutation),
        //         Events: Object.keys(rise.resolvers.Events)
        //     }
        // },
        Resources: {
            ...b.Resources,
            ...p.Resources
        },
        Outputs: {
            ...b.Outputs,
            ...p.Outputs
        }
    }
}
