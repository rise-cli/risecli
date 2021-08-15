export async function removeDeployment(io: any, name: string): Promise<string> {
    try {
        await io.remove({ name })
        return 'REMOVING'
    } catch (e) {
        throw new Error(e)
    }
}
