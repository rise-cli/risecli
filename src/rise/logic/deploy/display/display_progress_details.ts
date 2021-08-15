const chalk = require('chalk')

const output = (terminal: any) => ({
    writeTitle(x: any) {
        terminal.write(
            `${chalk.gray.bold(x.Resource)} | ${chalk.gray.bold(x.Status)}`
        )
    },

    writeResourceUpdating(x: any) {
        terminal.write(`${chalk.gray(x.Resource)} | ${chalk.blue(x.Status)}`)
    },

    writeResourceComplete(x: any) {
        terminal.write(`${chalk.gray(x.Resource)} | ${chalk.green(x.Status)}`)
    },

    clear() {
        terminal.clear()
    }
})

export function displayProgressDetails(io: any, details: any) {
    output(io.terminal).clear()
    details.forEach((x: any, i: number) => {
        if (i === 0) {
            output(io.terminal).writeTitle(x)
        } else {
            if (x.Status === 'COMPLETE') {
                output(io.terminal).writeResourceComplete(x)
            } else {
                output(io.terminal).writeResourceUpdating(x)
            }
        }
    })
}
