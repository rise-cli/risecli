const isEqual = require('lodash/isEqual')

const test = async (msg, callback) => {
    console.log(`- ${msg}`)
    await callback()
}

const expect = (actual) => {
    return {
        toBe: function (expected) {
            const res = expected === actual
            console.log(`expected = ${expected} actual = ${actual}`)
            if (!res) {
                throw new Error('Test Failed')
            }
            return res
        },
        toEqual: function (expected) {
            const res = isEqual(expected, actual)
            console.log(`expected = ${expected} actual = ${actual}`)
            if (!res) {
                throw new Error('Test Failed')
            }
            return res
        }
    }
}

test('my rise test', async () => {
    expect({ x: 1 }).toEqual({ x: 1 })
})
