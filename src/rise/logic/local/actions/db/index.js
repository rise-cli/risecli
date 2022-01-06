const low = require('lowdb')
const FileSync = require('lowdb/adapters/Memory')

const mainDb = (name) => {
    const adapter = new FileSync(`${name || 'db'}.json`)
    const db = low(adapter)

    /**
     * Setup: This function sets up the in memory database
     *
     */
    const setup = () => {
        db.defaults({}).write()
    }

    /**
     * Reset: This function returns the database to the state
     * defined in the input
     * @param {Object} startingState
     *
     */
    const reset = (startingState = {}) => {
        db.setState(startingState).write()
    }

    /**
     * Get
     * @param {string} pk
     * @param {string} sk
     *
     */
    const get = (input) => {
        const res = db.getState()
        const list = Object.keys(res).reduce((a, k) => {
            const items = res[k]
            items.forEach((item) => {
                a.push({
                    pk: k,
                    ...item
                })
            })

            return a
        }, [])

        if (input.pk2) {
            const res = list.filter(
                (x) => x.pk2 === input.pk2 && x.sk === input.sk
            )
            return res[0] || false
        }
        if (input.pk3) {
            const res = list.filter(
                (x) => x.pk3 === input.pk3 && x.sk === input.sk
            )
            return res[0] || false
        }
        if (input.pk) {
            const res = list.filter(
                (x) => x.pk === input.pk && x.sk === input.sk
            )
            return res[0] || false
        }
        return false

        // const result = db.get(pk).find({ sk: sk }).value()
        // if (result) {
        //     return {
        //         pk,
        //         sk,
        //         ...x
        //     }
        // }
        // return false
    }

    /**
     * List
     * @param {string} pk partition keu
     * @param {string} sk startsWith sort key
     *
     */
    const list = (input) => {
        const res = db.getState()
        const list = Object.keys(res).reduce((a, k) => {
            const items = res[k]
            items.forEach((item) => {
                a.push({
                    pk: k,
                    ...item
                })
            })

            return a
        }, [])

        if (input.pk2) {
            const res = list.filter(
                (x) => x.pk2 === input.pk2 && x.sk.startsWith(input.sk)
            )
            return res || []
        }
        if (input.pk3) {
            const res = list.filter(
                (x) => x.pk3 === input.pk3 && x.sk.startsWith(input.sk)
            )
            return res || []
        }
        if (input.pk) {
            const res = list.filter(
                (x) => x.pk === input.pk && x.sk.startsWith(input.sk)
            )
            return res || []
        }
        return []
        // const x = db.getState()
        // const partition = x[pk]
        // if (!partition) {
        //     return []
        // }
        // return partition
        //     .filter((x) => x.sk.startsWith(sk))
        //     .map((item) => {
        //         return {
        //             pk,
        //             ...item
        //         }
        //     })
    }

    /**
     * GetState
     *
     */
    const getCurrentState = () => {
        const x = db.getState()

        return Object.keys(x)
            .reduce((a, k) => {
                const items = x[k]
                items.forEach((item) => {
                    a.push({
                        pk: k,
                        ...item
                    })
                })

                return a
            }, [])
            .map((x) => ({
                ...x,
                pk: x.pk.replace('_dot_', '.')
            }))
    }

    /**
     * Set
     * @param {Object} item
     *
     */
    const set = (item) => {
        let itemToWrite = {}
        Object.keys(item).forEach((x) => {
            if (x === 'pk') {
                return
            }

            itemToWrite[x] = item[x]
        })

        // Set the PK if doesnt exist
        const pkExistsOnDb = db.has(item.pk).value()
        if (!pkExistsOnDb) {
            db.set(item.pk, []).write()
        }

        // If SK doesnt exist, put it there
        const found = db.get(item.pk).find({ sk: item.sk }).value()
        if (!found) {
            db.get(item.pk).push(itemToWrite).write()
            // Else, update the existing value
        } else {
            db.get(item.pk).remove({ sk: item.sk }).write()
            db.get(item.pk).push(itemToWrite).write()
        }
    }

    /**
     * Remove
     * @param {string} pk
     * @param {string} sk
     *
     */
    const remove = (input) => {
        const res = db.getState()
        const list = Object.keys(res).reduce((a, k) => {
            const items = res[k]
            items.forEach((item) => {
                a.push({
                    pk: k,
                    ...item
                })
            })

            return a
        }, [])

        if (input.pk2) {
            const res = list.filter(
                (x) => x.pk2 === input.pk2 && x.sk === input.sk
            )
            if (res[0]) {
                db.get(res[0].pk).remove({ sk: res[0].sk }).write()
                return input
            }
        }
        if (input.pk3) {
            const res = list.filter(
                (x) => x.pk3 === input.pk3 && x.sk === input.sk
            )
            if (res[0]) {
                db.get(res[0].pk).remove({ sk: res[0].sk }).write()
                return input
            }
        }
        if (input.pk) {
            const res = list.filter(
                (x) => x.pk === input.pk && x.sk === input.sk
            )

            if (res[0]) {
                db.get(res[0].pk).remove({ sk: res[0].sk }).write()
                return input
            }
        }
        return false
    }

    /**
     * Main
     * @param {Object} config
     *
     */
    //const main = (config) => {
    setup()
    reset({})
    // const table = config.table
    // const dbLocation = config.dbLocation
    // const initData = config.initData
    return {
        get,
        set,
        list,
        remove,
        getCurrentState,
        reset,
        setup: (arr) => {
            reset({})
            arr.forEach((x) => {
                set(x)
            })
        },

        firstItem: () => {
            return getCurrentState()[0]
        },

        size: () => {
            return getCurrentState().length
        }
    }
    // }
}
module.exports = mainDb
