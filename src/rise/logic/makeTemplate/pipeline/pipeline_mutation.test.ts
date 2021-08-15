import { buildRequestTemplate, makeMutationPipeline } from './pipeline_mutation'

test('buildRequestTemplate will create a valid request template', () => {
    const input = {
        one: '1',
        two: '!sub',
        three: '$id'
    }

    const result = buildRequestTemplate(input)
    expect(result).toMatchSnapshot()
})

test('makeMutationPipeline will create a valid vtl pipeline', () => {
    const input = {
        field: 'getNote',
        functions: ['f-1', 'f-2'],
        config: {
            one: '1',
            two: '!sub',
            three: '$id'
        }
    }

    const result = makeMutationPipeline(input)
    expect(result).toMatchSnapshot()
})
