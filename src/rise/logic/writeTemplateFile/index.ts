const YAML = require('json-to-pretty-yaml')

type WriteTemplateFileInput = {
    io: any
    template: object
    ci: string | boolean
}

/**
 * Pretty sure there is a nicer way to do this with
 * regex. Replacing things with any special string
 * can cause errors if someone uses that string
 * in their definition
 */
function takeOutQuotes(x: string): string {
    const reserve = (x: string): string => {
        return x
            .split('"2018-05-29"')
            .join('RISE_REPLACE_VERSION_TOKEN')
            .split('- ""')
            .join('RISE_REPLACE_FNJOIN_TOKEN')
            .split(`\\"`)
            .join('RISE_REPLACE_QUOTE_TOKEN')
    }

    const replace = (x: string): string => {
        return x.split('"').join('')
    }

    const putReservedBackIn = (x: string): string => {
        return x
            .split('RISE_REPLACE_QUOTE_TOKEN')
            .join('"')
            .split('RISE_REPLACE_FNJOIN_TOKEN')
            .join('- ""')
            .split('RISE_REPLACE_VERSION_TOKEN')
            .join('"2018-05-29"')
    }

    const reserveResult = reserve(x)
    const replaceResult = replace(reserveResult)
    return putReservedBackIn(replaceResult)
}

function unescapeNewLinesAndTabs(x: string): string {
    return x.split('\\n').join('\n').split('\\t').join('\t')
}

function setCloudformationNewLineCharacter(x: string): string {
    return x
        .split('RequestMappingTemplate:')
        .join('RequestMappingTemplate: |')
        .split('ResponseMappingTemplate:')
        .join('ResponseMappingTemplate: |')
        .split('ZipFile:')
        .join('ZipFile: |')
        .split('Definition:')
        .join('Definition: | \n')
}

function indentGraphQLSchema(x: string): string {
    const SCHEMA_STARTING_POINT = 'Definition: |'
    const SCHEMA_ENDING_POINT = 'ApiId:'
    let afterDefinition = false
    let pastFirstType = false
    let beforeApiId = true

    return x
        .split('\n')
        .map((x: string) => {
            if (x.includes(SCHEMA_ENDING_POINT)) {
                beforeApiId = false
            }
            if (afterDefinition && beforeApiId) {
                let result
                if (!pastFirstType) {
                    result = '        ' + x.trim()
                    pastFirstType = true
                } else {
                    result = '        ' + x
                }
                return result
            }

            if (x.includes(SCHEMA_STARTING_POINT)) {
                afterDefinition = true
            }

            return x
        })
        .join('\n')
}

export function writeTemplateFile(props: WriteTemplateFileInput): string {
    let str1 = YAML.stringify(props.template)
    let str2 = takeOutQuotes(`${str1}`)
    let str3 = unescapeNewLinesAndTabs(str2)
    let str4 = setCloudformationNewLineCharacter(str3)
    let str5 = indentGraphQLSchema(str4)

    if (!props.ci) {
        props.io.writeFile({
            path: process.cwd() + '/template.yml',
            content: str5
        })
    }

    return str5
}
