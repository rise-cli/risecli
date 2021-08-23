import { startDeployment } from './deploy_stack'

test('startDeployment can update stack', async () => {
    const io = {
        create: () => true,
        update: () => true
    }

    const result = await startDeployment({
        io,
        name: 'my-stack',
        template: 'MOCK_TEMPLATE'
    })
    expect(result).toBe('UPDATING')
})

test('startDeployment can create stack', async () => {
    const io = {
        create: () => true,
        update: () => {
            throw new Error('Stack [my-stack] does not exist')
        }
    }

    const result = await startDeployment({
        io,
        name: 'my-stack',
        template: 'MOCK_TEMPLATE'
    })
    expect(result).toBe('CREATING')
})

test('startDeployment can return no update required state', async () => {
    const io = {
        create: () => true,
        update: () => {
            throw new Error('No updates are to be performed.')
        }
    }

    const result = await startDeployment({
        io,
        name: 'my-stack',
        template: 'MOCK_TEMPLATE'
    })
    expect(result).toBe('NOTHING')
})

test('startDeployment will error if something goes wrong with update', async () => {
    const io = {
        create: () => true,
        update: () => {
            throw new Error('Some other error.')
        }
    }

    const test = async () =>
        await startDeployment({
            io,
            name: 'my-stack',
            template: 'MOCK_TEMPLATE'
        })

    await expect(test()).rejects.toThrow('Some other error.')
})

test('startDeployment will error if something goes wrong with create', async () => {
    const io = {
        create: () => {
            throw new Error('Some other error.')
        },
        update: () => {
            throw new Error('Stack [my-stack] does not exist')
        }
    }

    const test = async () =>
        await startDeployment({
            io,
            name: 'my-stack',
            template: 'MOCK_TEMPLATE'
        })

    await expect(test()).rejects.toThrow('Some other error.')
})
