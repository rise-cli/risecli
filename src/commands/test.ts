import { getFile, getJsFile, getDirectories } from '../rise/io/filesystem'
const { Command, flags } = require('@oclif/command')
const fs = require('fs')
const exec = require('child_process').spawn
const assert = require('assert')
//const jest2 = require('jest')
const { runRiseApp } = require('../rise/logic/local/server/risetest')
const chalk = require('chalk')
var equal = require('deep-equal')

class Test extends Command {
    async run() {
        // const commandData = this.parse(Local)
        const { flags } = this.parse(Test)

        // @ts-ignore
        global.results = []

        let testsToRun: any = []

        // @ts-ignore
        global.expect = (x: any) => {
            return {
                toBe: (ex: any) => {
                    if (ex === x) {
                        // @ts-ignore
                        //global.results.push('success')
                    } else {
                        throw new Error(`${x} does not match ${ex}`)
                    }
                },
                toEqual: (ex: any) => {
                    if (equal(ex, x)) {
                        // @ts-ignore
                        //global.results.push('success')
                    } else {
                        throw new Error(`${x} does not match ${ex}`)
                        //throw new Error(`${x} does not match ${ex}`)
                    }
                },
                toResemble: (ex: any) => {
                    Object.keys(ex).forEach((k) => {
                        if (ex[k].includes('@id')) {
                            const prefix = ex[k].split('@id')[0]
                            if (!x[k].startsWith(prefix)) {
                                throw new Error(
                                    `${ex[k]} id does not follow same pattern as ${x[k]}`
                                )
                            }
                        } else {
                            if (ex[k] !== x[k]) {
                                throw new Error(
                                    `${ex[k]} does not match ${x[k]}`
                                )
                            }
                        }
                    })
                },
                toBeUnauthorized: () => {
                    if (!x) {
                        throw new Error('r1')
                    }
                    if (!Array.isArray(x) || x.length === 0) {
                        throw new Error('r2')
                    }

                    if (!x[0].message) {
                        throw new Error('r3')
                    }
                    if (x[0].message !== 'Unauthorized') {
                        throw new Error('r4')
                    }
                }
            }
        }

        // @ts-ignore
        global.test = (name: string, fn: any) => {
            const runTest = async () => {
                const start = Date.now()
                try {
                    await fn()
                    const end = Date.now()

                    // @ts-ignore
                    global.results.push(
                        `  ✅ ${chalk.green('PASS')} ${name} ${chalk.gray(
                            `${end - start}ms`
                        )}`
                    )
                } catch (e: any) {
                    const end = Date.now()
                    // @ts-ignore
                    global.results.push(
                        `  ❌ ${chalk.red('FAIL')} ${name} ${chalk.gray(
                            e.message
                        )}`
                    )
                }
            }
            testsToRun.push(runTest)
        }
        // @ts-ignore
        global.runRiseApp = runRiseApp

        // run tests...
        const dirs = getDirectories(process.cwd() + '/modules')

        const possible = [
            process.cwd() + '/rise.test.js',
            ...dirs.map(
                (x: any) => process.cwd() + '/modules/' + x + '/rise.test.js'
            )
        ]

        possible.forEach((x: any) => {
            try {
                require(x)
            } catch (e) {}
        })

        //require(process.cwd() + '/rise.test.js')
        //require(process.cwd() + '/modules/hats/rise.test.js')

        for (const test of testsToRun) {
            await test()
        }

        // clean screen
        console.log('\x1B[2J\x1B[3J\x1B[H')

        console.log(chalk.bold('Rise Test'))
        console.log(chalk.bold('---------'))

        // @ts-ignore
        global.results.forEach((x) => {
            console.log(x)
        })

        // console.log('....> ', runRiseApp)
        // console.log('.......> ', testFile)
        // if (flags.watch) {
        //     await jest2.run([
        //         '--config',
        //         `${__dirname + '/../rise/logic/riseTest/jest.config.js'}`,
        //         '--watch'
        //     ])
        // } else {
        //     await jest2.run([
        //         '--config',
        //         `${__dirname + '/../rise/logic/riseTest/jest.config.js'}`,
        //         'rise.test.js'
        //     ])
        // }
    }
}

Test.description = `Run Rise Test
...
Extra documentation goes here
`

Test.flags = {
    name: flags.string({ char: 'n', description: 'name to print' }),
    watch: flags.string({ char: 'w', description: 'name to print' })
}

module.exports = Test
