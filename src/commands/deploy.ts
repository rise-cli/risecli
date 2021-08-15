import { Command, flags } from '@oclif/command'
import { deployCliCommand } from '../rise/cliCommands/deploy'

export default class Deploy extends Command {
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
        const { flags } = this.parse(Deploy)
        const input = {
            stage: flags.stage || 'dev',
            region: flags.region || 'us-east-1',
            profile: flags.profile || 'default',
            ci: flags.ci ? true : false
        }

        await deployCliCommand(input)
    }
}
