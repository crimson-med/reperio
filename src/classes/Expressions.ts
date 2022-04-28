export const htmlTags = /<.*?>|<\/.*?>/gm
export const scriptTagInclusive = /<script((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/script>/gm
export const styleTagInclusive = /<style((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/style>/gm
export const linkTagInclusive = /<link((?<attribute>(?<=.).*?(?="))|[^>]*)[>|\/>]/gm
export const titleTagInclusive = /<title((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/title>/gm
export const metaTagInclusive = /<meta((?<attribute>(?<=.).*?(?="))|[^>]*)[>|\/>]/gm
export const attributeSeperator = /(?<attribute>[a-zA-Z]*)="(?<value>.+?)"/gm
export const anchorTagInclusive = /<a((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/a>/gm
export const imageTagInclusive = /<img((?<attribute>(?<=.).*?(?="))|[^>]*)[>|\/>]/gm
export const h1TagInclusive = /<h1((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/h1>/gm
export const h2TagInclusive = /<h2((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/h2>/gm
export const h3TagInclusive = /<h3((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/h3>/gm
export const h4TagInclusive = /<h4((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/h4>/gm
export const h5TagInclusive = /<h5((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/h5>/gm
export const h6TagInclusive = /<h6((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/h6>/gm
export const svgTagInclusive = /<svg((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/svg>/gm
export const videoTagInclusive = /<video((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/video>/gm
export const tableTagInclusive = /<table((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/table>/gm
export const iframeTagInclusive = /<iframe((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/iframe>/gm
export const bodyTagInclusive = /<body((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/body>/gm
export const headTagInclusive = /<head((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/head>/gm
export const footerTagInclusive = /<head((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/footer>/gm
export const articleTagInclusive = /<head((?<attribute>(?<=.).*?(?="))|[^>]*)>(?<body>[\s\S]*?)<\/article>/gm
//<script.*(?<attribute>(?<=.).*(?=")).*>(?<body>[\s\S]*?)(?<=script>)
//<script.?([a-zA-Z]*=".+?")*?.?>(?<body>[\s\S]*?)(?<=script>)
// export const text = /(?<attribute>(?<=type=").+?(?="))/gm