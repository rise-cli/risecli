const dbSetup = require('./index')

test('local db will work', () => {
    const db = dbSetup({})
    // input items
    db.set({
        pk: 'user_1',
        sk: 'note_1',
        name: 'John'
    })

    db.set({
        pk: 'user_1',
        sk: 'note_2',
        name: 'John'
    })

    db.set({
        pk: 'user_1',
        sk: 'name',
        name: 'John'
    })

    // test get
    const item = db.get({
        pk: 'user_1',
        sk: 'note_1'
    })

    expect(item).toEqual({
        pk: 'user_1',
        sk: 'note_1',
        name: 'John'
    })

    // test list
    const items = db.list({
        pk: 'user_1',
        sk: 'note'
    })

    expect(items).toEqual([
        { pk: 'user_1', sk: 'note_1', name: 'John' },
        { pk: 'user_1', sk: 'note_2', name: 'John' }
    ])

    // test currentState
    const currentState = db.getCurrentState()
    expect(currentState).toEqual([
        { pk: 'user_1', sk: 'note_1', name: 'John' },
        { pk: 'user_1', sk: 'note_2', name: 'John' },
        { pk: 'user_1', sk: 'name', name: 'John' }
    ])

    // test remove
    db.remove({
        pk: 'user_1',
        sk: 'name'
    })

    const currentState2 = db.getCurrentState()
    expect(currentState2).toEqual([
        { pk: 'user_1', sk: 'note_1', name: 'John' },
        { pk: 'user_1', sk: 'note_2', name: 'John' }
    ])

    // test reset
    db.reset({})

    const currentState3 = db.getCurrentState()
    expect(currentState3).toEqual([])
})

test('pk2 list will work', () => {
    const db = dbSetup({})
    // input items
    db.set({
        pk: 'user_1',
        sk: 'note_1',
        pk2: 'org_1'
    })

    db.set({
        pk: 'user_2',
        sk: 'note_2',
        pk2: 'org_1'
    })

    db.set({
        pk: 'user_3',
        sk: 'note_3',
        pk2: 'org_2'
    })

    // test get
    const item = db.get({
        pk2: 'org_1',
        sk: 'note_1'
    })

    expect(item).toEqual({ pk: 'user_1', sk: 'note_1', pk2: 'org_1' })

    // test list
    const items = db.list({
        pk2: 'org_1',
        sk: 'note'
    })

    expect(items).toEqual([
        { pk: 'user_1', sk: 'note_1', pk2: 'org_1' },
        { pk: 'user_2', sk: 'note_2', pk2: 'org_1' }
    ])

    // test currentState
    const currentState = db.getCurrentState()

    expect(currentState).toEqual([
        { pk: 'user_1', sk: 'note_1', pk2: 'org_1' },
        { pk: 'user_2', sk: 'note_2', pk2: 'org_1' },
        { pk: 'user_3', sk: 'note_3', pk2: 'org_2' }
    ])

    // test remove
    db.remove({
        pk2: 'org_1',
        sk: 'note_1'
    })

    const currentState2 = db.getCurrentState()

    expect(currentState2).toEqual([
        { pk: 'user_2', sk: 'note_2', pk2: 'org_1' },
        { pk: 'user_3', sk: 'note_3', pk2: 'org_2' }
    ])
})
