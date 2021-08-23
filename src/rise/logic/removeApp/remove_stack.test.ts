import { removeDeployment } from './remove_stack'

test('removeDeployment can update stack', async () => {
    const io = {
        remove: () => true
    }

    const result = await removeDeployment({ io, name: 'my-stack' })
    expect(result).toBe('REMOVING')
})

test('removeDeployment will throw error if something goes wrong', async () => {
    const io = {
        remove: () => {
            throw new Error('something went wrong')
        }
    }

    const test = async () => await removeDeployment({ io, name: 'my-stack' })

    await expect(test()).rejects.toThrow('something went wrong')
})
