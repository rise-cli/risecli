// import { RiseBlock } from '../types'
// import getInfo from '../_utils/aws/cloudformation_getInfo'
// import gql from 'graphql-tag'
// const fs = require('fs')

// function makeLib() {
//     // front/src/lib/setupAmplify.js
//     return `import Amplify from 'aws-amplify'

// Amplify.configure({
//     aws_appsync_graphqlEndpoint: process.env.ENDPOINT,
//     aws_appsync_region: process.env.REGION,
//     aws_appsync_authenticationType: process.env.AUTHTYPE,
//     aws_appsync_apiKey: process.env.APIKEY
// })
// `
// }

// function makeEnv(props: any) {
//     // front/.env
//     return `ENDPOINT=${props.endpoint}
// REGION=${props.region}
// AUTHTYPE=${props.type}
// APIKEY=${props.apikey}
// `
// }

// function makePageImports() {
//     return `import { useEffect, useState } from "react";
// import { API, graphqlOperation } from "aws-amplify";`
// }

// function makeQuery() {
//     return `const GET_PRODUCTS = \`
//   query lisProducts($PK: String!) {
//     products(PK: $PK) {
//         PK
//         SK
//         title
//         category
//         price
//     }
//   }
// \`;`
// }

// function makeQueryHelper() {
//     return `async function query(query, data) {
//     return await API.graphql(
//         graphqlOperation(query, data)
//     );
// }`
// }

// function makeSubscriptionEffect() {
//     return `
//   useEffect(() => {
//     (async () => {
//       const data = {} // whatever you need it to be
//       try {
//         subscription = API.graphql(
//           graphqlOperation(SUBSCRIPTION, data)
//         ).subscribe({
//           next: (res) => {
//             // handle subscription update
//           },
//         });
//       } catch (e) {
//         // handle subscription connection issue
//       }
//     })();

//     return () => {
//       subscription.unsubscribe();
//     };
//   }, []);`
// }

// export default async function main(AWS: any, block: RiseBlock) {
//     let info
//     try {
//         info = await getInfo(AWS, block.config.name + '-dev')
//     } catch (e) {
//         throw new Error('Can only generate frontend once api is deployed')
//     }

//     const urlOutput = info.Outputs.find((x: any) => x.OutputKey === 'ApiUrl')
//     const apiKeyOutput = info.Outputs.find((x: any) => x.OutputKey === 'ApiKey')

//     const frontPath = process.cwd() + '/../'

//     if (!fs.existsSync(frontPath + 'front')) {
//         fs.mkdirSync(frontPath + 'front')
//     }
//     if (!fs.existsSync(frontPath + 'front/src')) {
//         fs.mkdirSync(frontPath + 'front/src')
//     }

//     if (!fs.existsSync(frontPath + 'front/src/pages')) {
//         fs.mkdirSync(frontPath + 'front/src/pages')
//     }

//     if (!fs.existsSync(frontPath + 'front/src/lib')) {
//         fs.mkdirSync(frontPath + 'front/src/lib')
//     }

//     if (!fs.existsSync(frontPath + 'front/src/utils')) {
//         fs.mkdirSync(frontPath + 'front/src/utils')
//     }

//     fs.writeFileSync(frontPath + 'front/src/lib/setupAmplify.js', makeLib())
//     fs.writeFileSync(
//         frontPath + 'front/.env',
//         makeEnv({
//             endpoint: urlOutput.OutputValue,
//             region: block.config.region,
//             type: 'API_KEY',
//             apikey: apiKeyOutput.OutputValue
//         })
//     )

//     fs.writeFileSync(
//         frontPath + 'front/src/pages/index.js',
//         `export default function Page() {
//   return <div>Hello</div>
// }`
//     )

//     fs.writeFileSync(
//         frontPath + 'front/package.json',
//         `{
//   "name": "${block.config.name}-front",
//   "version": "0.1.0",
//   "private": true,
//   "scripts": {
//     "dev": "next dev",
//     "build": "next build",
//     "start": "next start"
//   },
//   "dependencies": {
//     "aws-amplify": "^4.0.2",
//     "next": "11.0.1",
//     "react": "17.0.2",
//     "react-dom": "17.0.2"
//   },
//   "devDependencies": {
//     "autoprefixer": "^10.2.5",
//     "postcss": "^8.2.15",
//     "tailwindcss": "^2.1.2"
//   }
// }`
//     )

//     fs.writeFileSync(
//         frontPath + 'front/tailwind.config.js',
//         `module.exports = {
//   purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
//   darkMode: false, // or 'media' or 'class'
//   theme: {
//     extend: {},
//   },
//   variants: {
//     extend: {},
//   },
//   plugins: [],
// };`
//     )

//     fs.writeFileSync(
//         frontPath + 'front/postcss.config.js',
//         `
// module.exports = {
//   plugins: {
//     tailwindcss: {},
//     autoprefixer: {},
//   },
// }`
//     )

//     fs.writeFileSync(
//         frontPath + 'front/.gitignore',
//         `node_modules
// .env`
//     )

//     fs.writeFileSync(
//         frontPath + 'front/src/pages/_app.js',
//         `import "../lib/setupAmplify";

// function MyApp({ Component, pageProps }) {
//   return <Component {...pageProps} />;
// }

// export default MyApp;`
//     )

//     fs.writeFileSync(
//         frontPath + 'front/src/utils/api.js',
//         `import { API, graphqlOperation } from 'aws-amplify'

// export async function query({ query, data }) {
//     return await API.graphql(graphqlOperation(query, data))
// }

// export function makeSubscription({ query, variables, sub, next }) {
//     sub = API.graphql(graphqlOperation(query, variables)).subscribe({
//         next
//     })
// }

// export function removeSubscription(sub) {
//     sub.unsubscribe()
// }`
//     )
// }
