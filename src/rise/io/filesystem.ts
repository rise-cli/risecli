const fs = require('fs')

export function getFile(path: string): string {
    return fs.readFileSync(path, 'utf8')
}

export function getJsFile(path: string): string {
    return require(path)
}

export function getDirectories(source: string) {
    return fs
        .readdirSync(source, { withFileTypes: true })
        .filter((dirent: any) => dirent.isDirectory())
        .map((dirent: any) => dirent.name)
}

export function writeFile(props: { path: string; content: string }): void {
    fs.writeFileSync(props.path, props.content)
}

export function getProjectPath(): string {
    return process.cwd()
}
