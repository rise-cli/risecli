import { Command, flags } from '@oclif/command'
import { pullCliCommand } from '../rise/cliCommands/pull'

export default class Pull extends Command {
    static description = 'describe the command here'

    static examples = [
        `$ rise hello
hello world from ./src/hello.ts!
`
    ]

    static flags = {
        name: flags.string({ char: 'n', description: 'name to print' }),
        stage: flags.string({ char: 's', description: 'stage of app' }),
        region: flags.string({ char: 'r', description: 'region of app' }),
        ci: flags.string({ char: 'c', description: 'sets ci mode to true' }),
        profile: flags.string({
            char: 'p',
            description: 'aws profile used to deploy app'
        })
    }

    static args = [{ name: 'file' }]

    async run() {
        const { flags } = this.parse(Pull)
        const input = {
            stage: flags.stage || 'EMPTY',
            region: flags.region || 'EMPTY',
            profile: flags.profile || 'EMPTY',
            ci: flags.ci ? true : false
        }

        await pullCliCommand(input)
    }
}
