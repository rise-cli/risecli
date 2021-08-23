/**
 * @module
 * Doesnt the AWS SDK handle credentials for us automatically?
 * Why write this file?
 *
 * There are 2 reasons:
 * 1. This allows us to inject config defined in a rise file
 * 2. We can throw errors that are more directed towards rise users
 *
 */

type getCredentialsInput = {
    io: any
    AWS: any
    region?: string | false
    profile?: string | false
}

export function setAWSCredentials({
    io,
    AWS,
    region = false,
    profile = false
}: getCredentialsInput): any {
    /**
     * If AWS credentials are defined as ENV variables,
     * we chose those credentials above what is in the .aws/credentials
     * file. This works well for CI Pipelines
     *
     */

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        io.setConfig({
            AWS: AWS,
            key: process.env.AWS_SECRET_ACCESS_KEY,
            secret: process.env.AWS_SECRET_ACCESS_KEY,
            region: region || 'us-east-1'
        })
    }

    /**
     * If ENV variables are not defined, then we will use
     * credentials defined in .aws/credentials file.
     *
     */
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        try {
            io.setCredentials({
                AWS,
                profile: profile,
                region: region || 'us-east-1'
            })
        } catch (e) {
            throw new Error(
                'There was an issue reading your local AWS credentials from your credentials file. Learn more about configuring your credentails here:\n\nhttps://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html'
            )
        }
    }

    return AWS
}
