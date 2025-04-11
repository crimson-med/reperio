# Reperio

**Reperio** /reˈpe.ri.oː/, [rɛˈpɛrioː], to discover.

**Reperio** is a simple, lightweight library to parse and scrap html pages.

## Installation

```
yarn add reperio
```

---

## Benchmarking

Benchmarching is the time it takes to do the following actions:

| **Action**                          | **Time (ms)** |
| ----------------------------------- | ------------- |
| new Parser(20lines)                 | 0.49 ms       |
| new Parser(20lines).extractUrls()   | 0.49 ms       |
| new Parser(20000lines)              | 5.61 ms       |
| new Parser(2000lines).extractUrls() | 6.11 ns       |

---

## Usage

### Creating a `Parser`

There are two ways to invoke a parser:

- **Pass a string payload to the constructor**

```ts
const parser = new Parser(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Reperio Website</title>
    <script type="text/javascript">
        console.log("Me awesome script")
    </script>
  </head>
  <body>
    <h1>Welcome to the website</h1>
    <p>Welcome to the reperio test website</p>
  </body>
  <footer>
    <p>Burlet Mederic</p>
  </footer>
</html>
`);

console.log(parser.parsedPage.title);
// Reperio Website
```

- **Pass a URL to the `parserFromUrl` function**

`parserFromUrl` returns a promise of the following format.

```ts
parserFromUrl("https://scrapeme.live/shop/").then(({ error, parser }) => {
  if (parser) {
    console.log(parser.parsedPage.title);
    // Products - ScrapeMe
  }
});
```

### `parsedPage`

Once the parser is returned you can access the following components

- `title: string`

The title of the page

- `head: string`

Everything in between `<head></head>`

- `body: string`

Everything in between `<body></body>`

- `footer: string`

Everything in between `<footer></footer>`

- `meta: MetaHTMLTag[]`

Will return an array of `MetaHTMLTag` for each `<meta>` tag.

```ts
export interface MetaHTMLTag extends HTMLTag {
  attribute: HTMLTagName.meta;
  charset: string | undefined;
  content: string | undefined;
  name: string | undefined;
}
```

- `media.images: ImgHTMLTag[]`

Will return an array of `ImgHTMLTag` for each `<img>` tag.

```ts
export interface ImgHTMLTag extends HTMLTag {
  attribute: HTMLTagName.img;
  src: string | undefined;
  alt: string | undefined;
  height: string | undefined;
  width: string | undefined;
  body?: undefined;
}
```

- `media.videos: VideoHTMLTag[]`

Will return an array of `VideoHTMLTag` for each `<video>` tag.

```ts
export interface VideoHTMLTag extends HTMLTag {
  attribute: HTMLTagName.video;
  autoplay: string | undefined;
  controls: string | undefined;
  loop: string | undefined;
  poster: string | undefined;
  src: string | undefined;
  height: string | undefined;
  width: string | undefined;
}
```

- `links.links: LinkHTMLTag[]`

Will return an array of `LinkHTMLTag` for each `<link>` tag.

```ts
export interface LinkHTMLTag extends HTMLTag {
  attribute: HTMLTagName.link;
  href: string | undefined;
  crossorigin: string | undefined;
  rel: string | undefined;
  type: string | undefined;
  body?: undefined;
}
```

- `links.anchors: AnchorHTMLTag[]`

Will return an array of `AnchorHTMLTag` for each `<a>` tag.

```ts
export interface AnchorHTMLTag extends HTMLTag {
  attribute: HTMLTagName.a;
  download: string | undefined;
  href: string | undefined;
  target: string | undefined;
  type: string | undefined;
}
```

- `styles: StyleHTMLTag[]`

Will return an array of `StyleHTMLTag` for each `<style>` tag.

```ts
export interface StyleHTMLTag extends HTMLTag {
  attribute: HTMLTagName.style;
  type: string | undefined;
  body: string | undefined;
}
```

- `scripts: ScriptHTMLTag[]`

Will return an array of `ScriptHTMLTag` for each `<script>` tag.

```ts
export interface ScriptHTMLTag extends HTMLTag {
  attribute: HTMLTagName.script;
  async: string | undefined;
  crossorigin: string | undefined;
  defer: string | undefined;
  integrity: string | undefined;
  src: string | undefined;
  type: string | undefined;
  body: string | undefined;
}
```

- `tables: TableHTMLTag[]`

Will return an array of `TableHTMLTag` for each `<table>` tag. Tables are parsed into headers and rows, with content extraction for each cell.

```ts
export interface TableHTMLTag extends HTMLTag {
  attribute: HTMLTagName.table;
  body: string | undefined;
  headers: TableRow[];
  rows: TableRow[];
  rawHtml: string | undefined;
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableCell {
  content: string;
  originalHtml: string;
  text: string;
  colSpan?: number;
  rowSpan?: number;
}
```

---

### `extractUrls(removeDuplicates = true)`

This function will extract all the urls found in:

- images
- videos
- links
- anchors
- scripts

By default the function remove duplicates; you can set the `removeDuplicates` flag to false.

---

### `extractTablesToObject(tableIndex?: number)`

This function converts HTML tables into an array of JavaScript objects, where table headers are used as property names and cell values as property values.

- If no `tableIndex` is provided and there's only one table, it returns an array of objects for that table
- If no `tableIndex` is provided and there are multiple tables, it returns an array of arrays (one array per table)
- If a `tableIndex` is provided, it returns an array of objects for the specified table

Example:

```ts
// For a table with headers: First Name, Last Name, Age
// And rows with data: John/Doe/25, Jane/Smith/30

const tableData = parser.extractTablesToObject();
console.log(tableData);
/* Output:  
[
  {"First Name": "John", "Last Name": "Doe", "Age": "25"},
  {"First Name": "Jane", "Last Name": "Smith", "Age": "30"}
]
*/
```

---

### `extractImages(downloadLocation: string, removeDuplicates = true)`

This function will download all images to the specified folder in `downloadLocation`

By default the function remove duplicates; you can set the `removeDuplicates` flag to false.

---

### `findSentenceWithWord(payload: string, searchedTerm: string)`

This function will return all the sentences that have the matching term.

```ts
const para = `As she did so, a most extraordinary thing happened. Some random sentence with flung in it. The bed-clothes gathered themselves together, leapt up suddenly into a sort of peak, and then jumped headlong over the bottom rail. It was exactly as if a hand had clutched them in the centre and flung them aside. Immediately after, .........`;
const foundSentences = findSentenceWithWord(para, "flung");
console.log(foundSentences);
/*[
"Some random sentence with flung in it.",
"It was exactly as if a hand had clutched them in the centre and flung them aside."
]*/
```

---

### Other functions

All the functions used for parsing a payload are available for individual use.

- `removeWhitespace(payload: string)`

Will remove all new lines and double spaces.

- `parseTitle`

Extracts the content of the `<title></title>` tag.

- `parseHead`

Extracts the content of the `<head></head>` tag.

- `parseBody`

Extracts the content of the `<body></body>` tag.

- `parseFooter`

Extracts the content of the `<footer></footer>` tag.

- `parseMeta`

Extracts all the `<meta></meta>` tags

- `parseImages`

Extracts all the `<img>` tags

- `parseVideos`

Extracts all the `<video></video>` tags

- `parseLinks`

Extracts all the `<link>` tags

- `parseAnchors`

Extracts all the `<a></a>` tags

- `parseStyles`

Extracts all the `<style>` tags

- `parseScripts`

Extracts all the `<script></script>` tags

- `parseTables`

Extracts all the `<table></table>` tags, including their structure (headers and rows)

---

## Development

Please look at any open issues for submitting PRs

Follow established code principles

Update tests in `src/__tests__`.

### Publishing to npm

To publish an update to npm, follow these steps:

1. Update the version in `package.json` following [semantic versioning](https://semver.org/) principles:
   - MAJOR version for incompatible API changes
   - MINOR version for added functionality in a backward compatible manner
   - PATCH version for backward compatible bug fixes

2. Build the package:
   ```bash
   npm run build
   ```

3. Run tests to ensure everything works correctly:
   ```bash
   npm test
   ```

4. Create a new git tag for the version:
   ```bash
   git tag -a v1.x.x -m "Version 1.x.x"
   ```

5. Push the tag to GitHub:
   ```bash
   git push origin v1.x.x
   ```

6. Publish to npm:
   ```bash
   npm publish
   ```

   If you're publishing for the first time or after logging out:
   ```bash
   npm login
   npm publish
   ```

---

## Author

## Author

- [Burlet Mederic](https://github.com/crimson-med)
