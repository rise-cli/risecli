# risecli

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

# Installation

```bash
npm i -g risecli
```

# Usage

Deploy

```
rise deploy
```

Remove

```
rise remove
```

# Example Rise App

```js
module.exports = {
    schema: `
        type Note {
            pk: String
            sk: String
            title: String
            content: String
        }

        input NoteInput {
            sk: String
        }

        input CreateNoteInput {
            title: String
            content: String
        }

        input UpdateNoteInput {
            sk: String
            title: String
            content: String
        }

        input RemoveNoteInput {
            sk: String
        }

        type Query {
            note(input: NoteInput): Note
            notes: [Note]
        }

        type Mutation {
            create(input: CreateNoteInput): Note
            update(input: UpdateNoteInput): Note
            remove(input: RemoveNoteInput): Note
      
        }
    `,
    resolvers: {
        Query: {
            note: [
                {
                    type: 'add',
                    pk: '!sub'
                },
                {
                    type: 'db',
                    action: 'get'
                }
            ],
            notes: [
                {
                    type: 'add',
                    pk: '!sub',
                    sk: 'note_'
                },
                {
                    type: 'db',
                    action: 'list'
                }
            ]
        },
        Mutation: {
            create: [
                {
                    type: 'add',
                    pk: '!sub',
                    sk: 'note_@id'
                },
                {
                    type: 'db',
                    action: 'set'
                }
            ],
            update: [
                {
                    type: 'add',
                    pk: '!sub'
                },
                {
                    type: 'db',
                    action: 'set'
                }
            ],
            remove: [
                {
                    type: 'add',
                    pk: '!sub'
                },
                {
                    type: 'db',
                    action: 'remove'
                }
            ]
        }
    },
    config: {
        name: 'myApp',
        region: 'us-east-2',
        auth: true
    }
}
```
