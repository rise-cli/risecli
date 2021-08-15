import pipeline from './pipeline'
import base from './base/base'

export function createTemplate(rise: any) {
    const b = base(rise)
    const p = pipeline(rise)
    return {
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
