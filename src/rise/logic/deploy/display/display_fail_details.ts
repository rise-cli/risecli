type Input = {
    message: string
}

const output = (terminal: any) => ({
    clear() {
        terminal.clear()
    }
})

export function displayFailDetails(terminal: any, result: Input) {
    output(terminal).clear()

    terminal.write('')
    terminal.write('There was an issue deploying your app')
    terminal.write('Error: ' + result.message)
}
