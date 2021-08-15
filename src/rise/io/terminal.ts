export function clearTerminal() {
    const readline = require('readline')
    // @ts-ignore
    const blank = '\n'.repeat(process.stdout.rows)
    console.log(blank)
    readline.cursorTo(process.stdout, 0, 0)
    readline.clearScreenDown(process.stdout)
}

export function writeToTerminal(str: string) {
    console.log(str)
}
