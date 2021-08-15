import { Command, flags } from '@oclif/command'
import { removeCliCommand } from '../rise/cliCommands/remove'

export default class Remove extends Command {
    static description = 'describe the command here'
    static examples = [`$ risecli hello`]
    static args = [{ name: 'file' }]
    static flags = {
        name: flags.string({ char: 'n', description: 'name to print' }),
        stage: flags.string({ char: 's', description: 'stage of app' }),
        region: flags.string({ char: 'r', description: 'region of app' }),
        profile: flags.string({
            char: 'p',
            description: 'aws profile used to remove app'
        })
    }

    async run() {
        const { flags } = this.parse(Remove)
        const input = {
            stage: flags.stage || 'dev',
            region: flags.region || 'us-east-1',
            profile: flags.profile || 'default'
        }

        return await removeCliCommand(input)
    }
}
