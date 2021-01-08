const HtmlWebpackPlugin = require('html-webpack-plugin')
const https = require('https')
const HTMLParser = require('node-html-parser');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36'

const isValidURL = url => {
  return /fonts.googleapis.com/.test(url)
}

const downloadFont = url => {
  return new Promise((resolve) => {
    let rawData = ''
    https.get(
      url,
      {
        headers: {
          'user-agent': UA,
        },
      },
      res => {
        res.on('data', chunk => {
          rawData += chunk
        })
        res.on('end', () => {
          resolve(rawData.toString('utf8'))
        })
      }
    )
  })
}


const createInlineCss = async url => {
  if (!isValidURL(url)) {
    throw new Error('Invalid Google Fonts URL')
  }

  const content = await downloadFont(url)

  return (
    `<style data-href='${url}'>${content.replace(/(\n|\s)/g, '')}</style>`
  )
}

module.exports = {
  entry: './src/index.js',
  output: {
    path: `${__dirname}/out`,
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: 'html-loader',
        options: {
          preprocessor: async (content) => {
            const root = HTMLParser.parse(content)
            const links = root.querySelectorAll('link')
            console.log({ content })
            if(links) {
              const fontLink = links.find((htmlElement) => {
                console.log({htmlElement})
                return isValidURL(htmlElement.rawAttrs)
              })
              console.log({ links })
              if(fontLink) {
                const replaceDataHref = fontLink.rawAttrs.replace('href', 'data-href')
                const fontLinkUrl = fontLink.getAttribute('href')
                const lnlineCss = await createInlineCss(fontLinkUrl)
                console.log({ fontLink })
                console.log({ lnlineCss })
                console.log(fontLink.getAttribute('href'))
                return content.replace(fontLink.rawAttrs, replaceDataHref).replace(
                  '</head>',
                  `${lnlineCss}</head>`
                )
              }else {
                return content
              }
            } else {
              return content
            }
          }
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ],
};