import { getRiseModules } from './get'

test('getRiseModules can get root rise.js file', () => {
    const io = {
        getJsFile: () => ({ schema: 'ROOT' }),
        getDirectories: () => []
    }

    const result = getRiseModules(io, '/test')
    expect(result).toEqual({
        root: { schema: 'ROOT' },
        modules: []
    })
})

test('getRiseModules can get module rise.js files', () => {
    const io = {
        getJsFile: (p: string) => {
            if (p === '/test/rise.js') return { schema: 'ROOT' }
            if (p === '/test/modules/hats/rise.js') return { schema: 'HATS' }
            if (p === '/test/modules/shoes/rise.js') return { schema: 'SHOES' }
        },
        getDirectories: () => ['hats', 'shoes']
    }

    const result = getRiseModules(io, '/test')
    expect(result).toEqual({
        root: { schema: 'ROOT' },
        modules: [{ schema: 'HATS' }, { schema: 'SHOES' }]
    })
})

test('getRiseModules will get schema from schema.graphql if schema in block is not defined', () => {
    const io = {
        getJsFile: () => ({}),
        getFile: () => `ROOT.graphql`,
        getDirectories: () => []
    }

    const result = getRiseModules(io, '/test')
    expect(result).toEqual({
        root: { schema: `ROOT.graphql` },
        modules: []
    })
})

test('getRiseModules can get module schema.graphql file', () => {
    const io = {
        getJsFile: (p: string) => {
            if (p === '/test/rise.js') return { schema: 'ROOT' }
            if (p === '/test/modules/hats/rise.js') return {}
            if (p === '/test/modules/shoes/rise.js') return { schema: 'SHOES' }
        },
        getFile: () => `hats.graphql`,
        getDirectories: () => ['hats', 'shoes']
    }

    const result = getRiseModules(io, '/test')
    expect(result).toEqual({
        root: { schema: 'ROOT' },
        modules: [{ schema: 'hats.graphql' }, { schema: 'SHOES' }]
    })
})

test('getRiseModules will throw error if no rise.js file is found', () => {
    const io = {
        getJsFile: () => {
            throw new Error('cant find it')
        },
        getFile: () => `hats.graphql`,
        getDirectories: () => []
    }

    const test = () => {
        getRiseModules(io, '/test')
    }
    expect(test).toThrow('Your project does not have a rise.js file')
})

test('getRiseModules will throw error if root rise.js file does not have schema defined or have schema.graphql file', () => {
    const io = {
        getJsFile: () => ({}),
        getFile: () => {
            throw new Error('cant find it')
        },
        getDirectories: () => []
    }

    const test = () => {
        getRiseModules(io, '/test')
    }
    expect(test).toThrow(
        'Your rise.js file does not have schema defined, and does not have a schema.graphql file'
    )
})

test('getRiseModules will throw error if no rise.js module file is found', () => {
    const io = {
        getJsFile: (p: string) => {
            if (p === '/test/rise.js') return { schema: 'ROOT' }
            if (p === '/test/modules/hats/rise.js') {
                throw new Error('cant find it')
            }
            if (p === '/test/modules/shoes/rise.js') return { schema: 'SHOES' }
        },
        getFile: () => `hats.graphql`,
        getDirectories: () => ['hats', 'shoes']
    }

    const test = () => {
        getRiseModules(io, '/test')
    }
    expect(test).toThrow(
        'Your module does not have a rise.js file. Path: /test/modules/hats'
    )
})

test('getRiseModules will throw error if module rise.js file does not have schema defined or have schema.graphql file', () => {
    const io = {
        getJsFile: (p: string) => {
            if (p === '/test/rise.js') return { schema: 'ROOT' }
            if (p === '/test/modules/hats/rise.js') return {}
            if (p === '/test/modules/shoes/rise.js') return { schema: 'SHOES' }
        },
        getFile: () => {
            throw new Error('cant find it')
        },
        getDirectories: () => ['hats', 'shoes']
    }

    const test = () => {
        getRiseModules(io, '/test')
    }
    expect(test).toThrow(
        'Your module does not have schema defined, and does not have a schema.graphql file. Path: /test/modules/hats'
    )
})
