const blockOriginal = require(process.cwd() + '/rise.js')
//const AWS = require('aws-sdk')
const http = require('http')
const fs = require('fs')
// const db = new AWS.DynamoDB.DocumentClient({
//     region: process.env.AWS_REGION
// })
// const cognito = new aws.CognitoIdentityServiceProvider({
//     region: process.env.AWS_REGION
// })
const cognito = {}

let block = blockOriginal
const getModules = () => {
    try {
        return fs
            .readdirSync(process.cwd() + '/modules', { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name)
    } catch (e) {
        return []
    }
}

const folders = getModules()
for (const folder of folders) {
    const loaded = require(process.cwd() + '/modules/' + folder + '/rise.js')
    if (loaded.resolvers.Query) {
        block.resolvers.Query = {
            ...block.resolvers.Query,
            ...loaded.resolvers.Query
        }
    }
    if (loaded.resolvers.Mutation) {
        block.resolvers.Mutation = {
            ...block.resolvers.Mutation,
            ...loaded.resolvers.Mutation
        }
    }
}

// * * * * * * * * * * * * * * * * * * *
// UUID
// * * * * * * * * * * * * * * * * * * *

const crypto = require('crypto')

const byteToHex = []
for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).substr(1))
}

function bytesToUuid(buf, offset_) {
    const offset = offset_ || 0
    return (
        byteToHex[buf[offset + 0]] +
        byteToHex[buf[offset + 1]] +
        byteToHex[buf[offset + 2]] +
        byteToHex[buf[offset + 3]] +
        '-' +
        byteToHex[buf[offset + 4]] +
        byteToHex[buf[offset + 5]] +
        '-' +
        byteToHex[buf[offset + 6]] +
        byteToHex[buf[offset + 7]] +
        '-' +
        byteToHex[buf[offset + 8]] +
        byteToHex[buf[offset + 9]] +
        '-' +
        byteToHex[buf[offset + 10]] +
        byteToHex[buf[offset + 11]] +
        byteToHex[buf[offset + 12]] +
        byteToHex[buf[offset + 13]] +
        byteToHex[buf[offset + 14]] +
        byteToHex[buf[offset + 15]]
    ).toLowerCase()
}

function rng() {
    const rnds8 = new Uint8Array(16)
    return crypto.randomFillSync(rnds8)
}

function uuid(options, buf, offset) {
    options = options || {}
    const rnds = options.random || (options.rng || rng)()
    rnds[6] = (rnds[6] & 0x0f) | 0x40
    rnds[8] = (rnds[8] & 0x3f) | 0x80

    if (buf) {
        offset = offset || 0
        for (let i = 0; i < 16; ++i) {
            buf[offset + i] = rnds[i]
        }

        return buf
    }

    return bytesToUuid(rnds)
}

// * * * * * * * * * * * * * * * * * * *
// Make Password
// * * * * * * * * * * * * * * * * * * *
function makePassword() {
    const id = uuid().split('-').join('').slice(0, 10)
    const addCharacter = (x, char) => {
        const i = Math.floor(Math.random() * 10) + 1
        const arr = x.split('')
        arr.splice(i, 0, char)
        return arr.join('')
    }

    const withUppercaseLetter = addCharacter(id, 'C')
    const withSpecialCharacter = addCharacter(withUppercaseLetter, '!')
    return withSpecialCharacter
}

// * * * * * * * * * * * * * * * * * * *
// Users
// * * * * * * * * * * * * * * * * * * *
const users = (cognito) => {
    async function createUser({ email }) {
        if (!email) {
            throw new Error('CreateUser must have an email defined')
        }

        // if (!process.env.USERPOOL_ID) {
        //     throw new Error(
        //         'CreateUser must have process.env.USERPOOL_ID defined'
        //     )
        // }

        const pass = makePassword()
        const params = {
            UserPoolId: '', //process.env.USERPOOL_ID,
            Username: email,
            TemporaryPassword: pass,
            MessageAction: 'SUPPRESS',
            UserAttributes: [
                {
                    Name: 'name',
                    Value: email
                },
                {
                    Name: 'email',
                    Value: email
                },
                {
                    Name: 'email_verified',
                    Value: 'True'
                }
            ]
        }

        try {
            await cognito.adminCreateUser(params).promise()
            return {
                email,
                password: pass
            }
        } catch (err) {
            throw new Error(err)
        }
    }

    async function removeUser({ email }) {
        if (!email) {
            throw new Error('RemoveUser must have an email defined')
        }

        // if (!process.env.USERPOOL_ID) {
        //     throw new Error(
        //         'CreateUser must have process.env.USERPOOL_ID defined'
        //     )
        // }

        const params = {
            UserPoolId: '', //process.env.USERPOOL_ID,
            Username: email
        }

        try {
            await cognito.adminDeleteUser(params).promise()
            return true
        } catch (err) {
            throw new Error(err)
        }
    }

    const hasUserUsedTemporaryPassword = async (email) => {
        const params = {
            UserPoolId: '', //process.env.USERPOOL_ID,
            Username: email
        }

        const x = await cognito.adminGetUser(params).promise()
        return x.UserStatus !== 'FORCE_CHANGE_PASSWORD'
    }

    async function resetPassword({ email }) {
        if (!email) {
            throw new Error('ResetPassword must have an email defined')
        }

        if (!process.env.USERPOOL_ID) {
            throw new Error(
                'CreateUser must have process.env.USERPOOL_ID defined'
            )
        }

        const usedTemp = await hasUserUsedTemporaryPassword(email)

        if (usedTemp) {
            return false
        }

        const newPassword = password()

        await removeUser({ email })
        await createUser({
            email: email,
            password: newPassword
        })

        return {
            email: email,
            password: newPassword
        }
    }

    return {
        createUser,
        removeUser,
        resetPassword
    }
}

// * * * * * * * * * * * * * * * * * * *
// Rise
// * * * * * * * * * * * * * * * * * * *

// actionDef => (input, ctx) =>
// actionDef: instructions on what to do, including fucntion to call (always differnt)
// input: either from endpoint, or from the past action (soemtimes different)
// ctx: always is the same context from endpoint input (never different)

const rise =
    (db, cognito) =>
    ({ qlType, qlField, table }) => {
        const f = async (input) => {
            if (
                input.type !== 'db' &&
                input.type !== 'log' &&
                input.type !== 'logError'
            ) {
                return input.input
            }

            if (input.type === 'log') {
                console.log(
                    JSON.stringify({
                        pltfm: 'RISE',
                        app: table,
                        field: `${qlType}__${qlField}`,
                        log: input.message,
                        type: 'info'
                    })
                )
                return
            }

            if (input.type === 'logError') {
                console.log(
                    JSON.stringify({
                        pltfm: 'RISE',
                        app: table,
                        field: `${qlType}__${qlField}`,
                        log: input.error.message,
                        stack: input.error.stack,
                        type: 'error'
                    })
                )
                return
            }

            const action = {
                action: input.action,
                table
            }

            const newInput = input.input

            if (newInput.pk !== '@id' && newInput.pk.includes('@id')) {
                newInput.pk = newInput.pk.replace('@id', uuid())
            }

            if (newInput.pk === '@id') {
                newInput.pk = uuid()
            }

            if (newInput.sk !== '@id' && newInput.sk.includes('@id')) {
                newInput.sk = newInput.sk.replace('@id', uuid())
            }

            if (newInput.sk === '@id') {
                newInput.sk = uuid()
            }

            if (
                newInput.pk2 &&
                newInput.pk2 !== '@id' &&
                newInput.pk2.includes('@id')
            ) {
                newInput.pk2 = newInput.pk2.replace('@id', uuid())
            }

            if (newInput.pk2 === '@id') {
                newInput.pk2 = uuid()
            }

            if (
                newInput.pk3 &&
                newInput.pk3 !== '@id' &&
                newInput.pk3.includes('@id')
            ) {
                newInput.pk3 = newInput.pk3.replace('@id', uuid())
            }

            if (newInput.pk3 === '@id') {
                newInput.pk3 = uuid()
            }

            if (action.action === 'CREATE') {
                let newObj = {
                    ...newInput
                }

                db.set(newObj)

                return {
                    ...newObj
                }
            }

            if (action.action === 'GET') {
                let params
                if (newInput.pk) {
                    params = {
                        pk: newInput.pk,
                        sk: newInput.sk
                    }
                }
                if (newInput.pk2) {
                    params = {
                        pk2: newInput.pk2,
                        sk: newInput.sk
                    }
                }
                if (newInput.pk3) {
                    params = {
                        pk3: newInput.pk3,
                        sk: newInput.sk
                    }
                }
                const item = db.get(params)

                return {
                    ...item.Item
                }
            }

            if (action.action === 'QUERY') {
                let params
                if (newInput.pk) {
                    params = {
                        pk: newInput.pk,
                        sk: newInput.sk
                    }
                }
                if (newInput.pk2) {
                    params = {
                        pk2: newInput.pk2,
                        sk: newInput.sk
                    }
                }
                if (newInput.pk3) {
                    params = {
                        pk3: newInput.pk3,
                        sk: newInput.sk
                    }
                }
                const result = db.list(params)
                return result.Items
            }

            if (action.action === 'REMOVE') {
                db.remove({
                    pk: newInput.pk,
                    sk: newInput.sk
                })

                return newInput
            }

            throw new Error(
                'DB ACTION ' + action.action + ', table: ' + action.table
            )
        }
        f.log = (m) => {
            console.log(
                JSON.stringify({
                    pltfm: 'RISE',
                    app: table,
                    field: `${qlType}__${qlField}`,
                    log: m,
                    type: 'info'
                })
            )
        }

        return f
    }

const mainFunction =
    (db, events, cognito, config, stash) =>
    async ({ path, input, identity, action, arrayIndex }) => {
        let newInput = input.input ? input.input : input

        if (
            newInput.pk &&
            newInput.pk !== '@id' &&
            newInput.pk.includes('@id')
        ) {
            newInput.pk = newInput.pk.replace('@id', uuid())
        }

        if (newInput.pk && newInput.pk === '@id') {
            newInput.pk = uuid()
        }

        if (
            newInput.sk &&
            newInput.sk !== '@id' &&
            newInput.sk.includes('@id')
        ) {
            newInput.sk = newInput.sk.replace('@id', uuid())
        }

        if (newInput.sk && newInput.sk === '@id') {
            newInput.sk = uuid()
        }

        if (
            newInput.pk2 &&
            newInput.pk2 !== '@id' &&
            newInput.pk2.includes('@id')
        ) {
            newInput.pk2 = newInput.pk2.replace('@id', uuid())
        }

        if (newInput.pk2 === '@id') {
            newInput.pk2 = uuid()
        }

        if (
            newInput.pk3 &&
            newInput.pk3 !== '@id' &&
            newInput.pk3.includes('@id')
        ) {
            newInput.pk3 = newInput.pk3.replace('@id', uuid())
        }

        if (newInput.pk3 === '@id') {
            newInput.pk3 = uuid()
        }

        if (action.pk && action.pk.includes('!')) {
            const parts = action.pk.split('!')
            const str = parts[0]
            const input = parts[1]

            const arrOfValues = input.split('.')

            action.pk =
                str +
                arrOfValues.reduce((acc, k) => {
                    return acc[k]
                }, identity)

            //action.pk = identity[v]
        }
        if (action.sk && action.sk.includes('!')) {
            const parts = action.sk.split('!')
            const str = parts[0]
            const input = parts[1]

            const arrOfValues = input.split('.')

            action.sk =
                str +
                arrOfValues.reduce((acc, k) => {
                    return acc[k]
                }, identity)
        }
        // if (action.pk && action.pk.startsWith('$')) {
        //     const v = action.pk.slice(1)
        //     action.pk = newInput[v]
        // }
        // if (action.sk && action.sk.startsWith('$')) {
        //     const v = action.sk.slice(1)
        //     action.sk = newInput[v]
        // }

        if (action.pk && action.pk.includes('$')) {
            const parts = action.pk.split('$')
            const str = parts[0]
            const input = parts[1]

            const arrOfValues = input.split('.')

            action.pk =
                str +
                arrOfValues.reduce((acc, k) => {
                    return acc[k]
                }, newInput)

            //action.pk = identity[v]
        }
        if (action.sk && action.sk.includes('$')) {
            const parts = action.sk.split('$')
            const str = parts[0]
            const input = parts[1]

            const arrOfValues = input.split('.')

            action.sk =
                str +
                arrOfValues.reduce((acc, k) => {
                    return acc[k]
                }, newInput)
        }

        if (Array.isArray(action) && !arrayIndex) {
            let index = 0
            let result = newInput
            let actions = action
            for (const action of actions) {
                result = await mainFunction(
                    db,
                    events,
                    cognito,
                    config,
                    stash
                )({
                    path,
                    input: result,
                    identity,
                    action,
                    arrayIndex: index
                })

                index++
            }
            return result
        }

        if (Array.isArray(action) && (arrayIndex === 0 || arrayIndex)) {
            throw new Error('Cannot have an array within an array for actions')
        }

        if (action.type === 'db') {
            if (action.action === 'set') {
                let newObj = {
                    ...newInput
                }

                db.set(newObj)

                return {
                    ...newObj
                }
            }

            if (action.action === 'get') {
                const item = db.get({
                    pk: newInput.pk,
                    sk: newInput.sk
                })

                return {
                    ...item
                }
            }

            if (action.action === 'list') {
                const params = {
                    TableName: action.table,
                    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
                    ExpressionAttributeValues: {
                        ':pk': newInput.pk,
                        ':sk': newInput.sk
                    }
                }

                const result = db.list({
                    pk: newInput.pk,
                    sk: newInput.sk
                })
                return result
            }

            if (action.action === 'remove') {
                db.remove({
                    pk: newInput.pk,
                    sk: newInput.sk
                })

                return newInput
            }

            throw new Error(
                'DB ACTION ' + action.action + ', table: ' + action.table
            )
        }

        if (action.type === 'emit-event') {
            const newData = Object.keys(action.data).reduce((acc, x) => {
                if (action.data[x].startsWith('$')) {
                    acc[x] = newInput[action.data[x].slice(1)]
                    return acc
                }

                acc[x] = action.data[x]
                return acc
            }, {})

            events.set({
                Source: 'custom.' + config.name,
                EventBusName: config.eventBus,
                DetailType: action.event,
                Detail: newData
            })

            //events.set(newInput)
        }

        if (action.type === 'guard') {
            const item = db.get({
                pk: action.pk,
                sk: action.sk
            })

            if (item) {
                return newInput
            } else {
                throw new Error('Unauthorized')
            }
        }

        if (action.type === 'add') {
            delete action.type

            Object.keys(action).forEach((k) => {
                if (action[k].startsWith('!')) {
                    const v = action[k].slice(1)
                    newInput[k] = identity[v]
                } else if (action[k].startsWith('$')) {
                    const v = action[k].slice(1)
                    newInput[k] = newInput[v]
                } else if (action[k].includes('@id')) {
                    newInput[k] = action[k].replace('@id', uuid())
                } else {
                    newInput[k] = action[k]
                }
            })

            return newInput
        }

        if (action.type === 'http') {
            throw new Error('HTTP URL ' + action.url)
        }

        if (action.type === 'users') {
            if (action.action === 'create') {
                const v = action.email.slice(1)
                const email = newInput[v]

                await users(cognito).createUser({
                    email: email
                })
                return newInput
            }

            if (action.action === 'remove') {
                const v = action.email.slice(1)
                const email = newInput[v]

                await users(cognito).removeUser({
                    email: email
                })
                return newInput
            }
        }

        /**
         * || action === 'FUNCTION'
         * is not in the real _index.js file
         * need to fis this so this isnt a confusing difference
         *
         */
        if (action.type === 'FUNCTION' || action === 'FUNCTION') {
            try {
                if (arrayIndex !== false) {
                    const x = await block.resolvers[path.type][path.field][
                        arrayIndex
                    ](
                        input,
                        rise(
                            db,
                            cognito
                        )({
                            table: action.app + '-' + action.stage,
                            qlType: path.type,
                            qlField: path.field
                        }),
                        identity
                    )

                    return x
                } else {
                    const x = await block.resolvers[path.type][path.field](
                        input,
                        rise(
                            db,
                            cognito
                        )({
                            table: action.app + '-' + action.stage,
                            qlType: path.type,
                            qlField: path.field
                        }),
                        identity
                    )

                    return x
                }
            } catch (e) {
                console.log(
                    JSON.stringify({
                        pltfm: 'RISE',
                        app: action.app,
                        field: `${path.type}__${path.field}`,
                        log: e.message,
                        type: 'error',
                        stack: e.stack
                    })
                )
                throw new Error(e)
            }
        }

        throw new Error('Unsupported action')
    }

module.exports.handler = (db, events, cognito, config) => async (event) => {
    const path = {
        type: event.ctx.info.parentTypeName,
        field: event.ctx.info.fieldName
    }

    const input = event.ctx.arguments
    const identity = event.ctx.identity
    const action = event.action

    return await mainFunction(
        db,
        events,
        cognito,
        config,
        {} // stash
    )({
        path,
        input,
        identity,
        action,
        arrayIndex: false
    })
}
