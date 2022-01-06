export function makeInput(config: any) {
    try {
        let requestTemplate = `   
        $util.qr($ctx.stash.put("localInput", {}))	
    `
        Object.keys(config).forEach((k) => {
            // Starts With
            let value = config[k]

            //@now: $util.time.nowEpochMilliSeconds()

            //@today: $util.time.nowFormatted("yyyy-MM-dd")

            if (value.startsWith('@now')) {
                value = value.replace(
                    '@now',
                    '$util.time.nowEpochMilliSeconds()'
                )
            } else if (value.startsWith('#userId')) {
                value = value.replace('#userId', '$ctx.stash.userId')
            } else if (value.startsWith('#userPassword')) {
                value = value.replace(
                    '#userPassword',
                    '$ctx.stash.userPassword'
                )
            } else if (value.startsWith('$')) {
                value = value.replace('$', '$ctx.args.input.')
            } else if (value.startsWith('!')) {
                value = value.replace('!', '$ctx.identity.claims.')
            } else if (value.startsWith('<')) {
                value = value.replace('<', '$ctx.prev.result.')
            } else {
                value = `"${value}"`
            }

            // Contains Replace
            if (value.includes('{') && value.includes('}')) {
                let stringToUse = ''
                let replaceText: any = []
                let replaceIndex = -1

                let replace = false
                value.split('').forEach((ch: any, i: number, l: any) => {
                    if (l[i] === '{') {
                        replaceIndex++
                        replace = true
                    } else if (l[i] === '}') {
                        replace = false
                    } else {
                        stringToUse = stringToUse + ch
                        if (replace) {
                            if (!replaceText[replaceIndex]) {
                                replaceText[replaceIndex] = ch
                            } else {
                                replaceText[replaceIndex] =
                                    replaceText[replaceIndex] + ch
                            }
                        }
                    }
                })

                requestTemplate =
                    requestTemplate + `#set ($${k}Value = ${stringToUse})`
                replaceText.forEach((value: string) => {
                    let original = value

                    if (value.startsWith('@now')) {
                        value = value.replace(
                            '@now',
                            '$util.time.nowEpochMilliSeconds().toString()'
                        )
                    } else if (value.startsWith('@today')) {
                        value = value.replace(
                            '@today',
                            '$util.time.nowFormatted("yyyy-MM-dd")'
                        )
                    } else if (value.startsWith('#userId')) {
                        value = value.replace('#userId', '$ctx.stash.userId')
                    } else if (value.startsWith('#userPassword')) {
                        value = value.replace(
                            '#userPassword',
                            '$ctx.stash.userPassword'
                        )
                    } else if (value.startsWith('$')) {
                        value = value.replace('$', '$ctx.args.input.')
                    } else if (value.startsWith('!')) {
                        value = value.replace('!', '$ctx.identity.claims.')
                    } else if (value.startsWith('<')) {
                        value = value.replace('<', '$ctx.prev.result.')
                    } else if (value.startsWith('@id')) {
                        value = value.replace('@id', '$util.autoId()')
                    } else {
                        value = `"${value}"`
                    }

                    requestTemplate =
                        requestTemplate +
                        `\n #set ($${k}Value= $util.str.toReplace($${k}Value , "${original}", ${value}))\n`
                })

                value = `$${k}Value`
            }
            /* 
            #set ($str = "..@a..@b..@c")
    #set ($str = $util.str.toReplace($str , "@a", "1"))
    #set ($str = $util.str.toReplace($str , "@b", "2"))
    */

            // Replace
            if (value.includes('@id')) {
                requestTemplate =
                    requestTemplate +
                    `           $util.qr($ctx.stash.localInput.put("${k}", $util.str.toReplace(${value}, "@id", $util.autoId())))\n`
            } else {
                requestTemplate =
                    requestTemplate +
                    `           $util.qr($ctx.stash.localInput.put("${k}", ${value}))\n`
            }
        })

        return requestTemplate
    } catch (e) {
        console.log('here........', config)
        return ''
    }
}
