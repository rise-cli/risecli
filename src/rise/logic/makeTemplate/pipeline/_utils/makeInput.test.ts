import { makeInput } from './makeInput'

test('makeInput will make input', () => {
    const res = makeInput({
        pk: 'one',
        sk: 'two'
    })

    console.log(res)

    // expect(res.replace(/ /g, '')).toBe(
    //     `
    //         #if($util.isNullOrEmpty($ctx.args.input))
    //         $util.qr($ctx.stash.put("input",{}))
    //         #else
    //             $util.qr($ctx.stash.put("input", $ctx.args.input))
    //         #end
    //            $util.qr($ctx.stash.input.put("pk", "one")) $util.qr($ctx.stash.input.put("sk", "two"))
    //          {}`.replace(/ /g, '')
    // )
})
