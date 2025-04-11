import {
  anchorTagInclusive,
  attributeSeperator,
  bodyTagInclusive,
  footerTagInclusive,
  headTagInclusive,
  imageTagInclusive,
  linkTagInclusive,
  metaTagInclusive,
  scriptTagInclusive,
  styleTagInclusive,
  tableTagInclusive,
  titleTagInclusive,
  videoTagInclusive,
} from "./classes/Expressions";
import * as needle from "needle";
import { createWriteStream } from "fs";
import { join } from "path";

export class Parser {
  payload: string;
  parsedPage: ParsedPage;
  constructor(payload: string, title?: string) {
    this.resetAllRegex();
    this.payload = removeWhitespace(payload);
    this.parsedPage = {
      title: "",
      head: "",
      body: "",
      footer: "",
      meta: [],
      media: {
        images: [],
        videos: [],
      },
      links: {
        links: [],
        anchors: [],
      },
      styles: [],
      scripts: [],
      tables: [],
    };
    this.parsedPage.title = title ? title : parseTitle(this.payload);
    this.parsedPage.head = parseHead(this.payload);
    this.parsedPage.body = parseBody(this.payload);
    this.parsedPage.footer = parseFooter(this.payload);
    this.parsedPage.meta = parseMeta(this.parsedPage.head);
    this.parsedPage.media = {
      images: parseImages(this.parsedPage.body),
      videos: parseVideos(this.parsedPage.body),
    };
    this.parsedPage.links = {
      links: parseLinks(this.parsedPage.head),
      anchors: parseAnchors(this.parsedPage.body),
    };
    this.parsedPage.styles = parseStyles(this.parsedPage.head);
    this.parsedPage.scripts = parseScripts(this.payload);
    this.parsedPage.tables = parseTables(this.parsedPage.body);
  }

  extractUrls(removeDuplicates = true) {
    const images = this.parsedPage.media.images.map((i) => {
      if (i.src !== undefined) return i.src;
    });
    const videos = this.parsedPage.media.videos.map((i) => {
      if (i.src !== undefined) return i.src;
    });
    const links = this.parsedPage.links.links.map((i) => {
      if (i.href !== undefined) return i.href;
    });
    const anchors = this.parsedPage.links.anchors.map((i) => {
      if (i.href !== undefined) return i.href;
    });
    const scripts = this.parsedPage.scripts.map((i) => {
      if (i.src !== undefined) return i.src;
    });
    const allResults = images
      .concat(videos, links, anchors, scripts)
      .filter((val) => val !== undefined);
    if (removeDuplicates) {
      return [...new Set(allResults)];
    }
    return allResults;
  }
  
  /**
   * Convert tables to an array of objects where the headers are used as keys
   * @param tableIndex Optional index of the specific table to convert (defaults to all tables)
   * @returns An array of objects representing the table data
   */
  extractTablesToObject(tableIndex?: number): Record<string, string>[] | Record<string, string>[][] {
    // If a specific table index is provided, convert only that table
    if (tableIndex !== undefined && this.parsedPage.tables[tableIndex]) {
      return this._tableToArray(this.parsedPage.tables[tableIndex]);
    }
    
    // Otherwise convert all tables
    if (this.parsedPage.tables.length === 0) {
      return [];
    } else if (this.parsedPage.tables.length === 1) {
      // If there's only one table, return just the data array
      return this._tableToArray(this.parsedPage.tables[0]);
    } else {
      // If there are multiple tables, return an array of data arrays
      return this.parsedPage.tables.map(table => this._tableToArray(table));
    }
  }
  
  /**
   * Internal helper method to convert a table to an array of objects
   * @private
   */
  private _tableToArray(table: TableHTMLTag): Record<string, string>[] {
    const result: Record<string, string>[] = [];
    
    // Extract header texts to use as keys
    const headerTexts: string[] = [];
    table.headers.forEach(headerRow => {
      headerRow.cells.forEach(cell => {
        headerTexts.push(cell.text);
      });
    });
    
    // Create an object for each row using header texts as keys
    table.rows.forEach(row => {
      const rowObject: Record<string, string> = {};
      
      // Map each cell to its corresponding header
      row.cells.forEach((cell, index) => {
        if (index < headerTexts.length) {
          rowObject[headerTexts[index]] = cell.text;
        }
      });
      
      result.push(rowObject);
    });
    
    return result;
  }

  resetAllRegex() {
    anchorTagInclusive.lastIndex = 0;
    attributeSeperator.lastIndex = 0;
    bodyTagInclusive.lastIndex = 0;
    footerTagInclusive.lastIndex = 0;
    headTagInclusive.lastIndex = 0;
    imageTagInclusive.lastIndex = 0;
    linkTagInclusive.lastIndex = 0;
    metaTagInclusive.lastIndex = 0;
    scriptTagInclusive.lastIndex = 0;
    styleTagInclusive.lastIndex = 0;
    titleTagInclusive.lastIndex = 0;
    videoTagInclusive.lastIndex = 0;
    tableTagInclusive.lastIndex = 0;
  }

  extractImages(downloadLocation: string, removeDuplicates = true) {
    return new Promise<ExtractedFiles>((resolveDownload, rejectDownload) => {
      let downloadResult: ExtractedFiles = {
        totalDownloaded: 0,
        totalFiles: 0,
        fileNames: [],
        errors: [],
      };
      let images = this.parsedPage.media.images.map((i) => {
        if (i.src !== undefined) return i.src;
      });
      if (removeDuplicates) {
        images = [...new Set(images)];
      }
      downloadResult.totalFiles = images.length;
      const imagesPromised = images.map((img) => {
        if (img) {
          const name = img.slice(img.lastIndexOf("/"), img.length);
          const pathToImage = join(downloadLocation, name);
          return new Promise<string>((resolve, reject) => {
            try {
              const resp = needle.get(img, { follow_max: 5, follow: 5 });
              console.log(resp);
              const str = createWriteStream(pathToImage);
              resp.pipe(str);
              resp.on("done", function (err) {
                str.destroy();
                resolve(pathToImage);
              });
              resp.on("error", (err) => {
                str.destroy();
                reject(err);
              });
              resp.on("close", () => {
                str.destroy();
                reject("connection closed");
              });
            } catch (error) {
              console.log(error);
              reject(error);
            }
          });
        }
      });
      try {
        Promise.allSettled(imagesPromised).then((result) => {
          result.map((prom) => {
            if (prom.status === "fulfilled") {
              if (prom.value) {
                downloadResult.fileNames.push(prom.value);
                downloadResult.totalDownloaded++;
              }
            } else {
              downloadResult.errors.push(prom.reason);
              // prom.reason
            }
          });
          resolveDownload(downloadResult);
        });
      } catch (error) {
        rejectDownload(error);
      }
    });
  }
}

export const parserFromUrl = (url: string) => {
  return new Promise<
    { error: undefined; parser: Parser } | { error: Error; parser: undefined }
  >((resolve, reject) => {
    needle("get", url, { follow_max: 5, follow: 5 })
      .then((resp) => {
        const parserInstance = new Parser(resp.body);
        resolve({ error: undefined, parser: parserInstance });
      })
      .catch((err) => {
        reject({ error: err, parser: undefined });
      });
  });
};
export const removeWhitespace = (payload: string) => {
  const noNewLines = payload.replace(/(\r\n|\r|\n)/g, "");
  return noNewLines.replace(/\s{2,}/gm, "");
};

export const parseTitle = (payload: string) => {
  let matches = titleTagInclusive.exec(payload);
  if (matches && matches.groups && matches.groups.body) {
    return matches.groups.body;
  }
  return "";
};

export const parseHead = (payload: string) => {
  let matches = headTagInclusive.exec(payload);
  if (matches && matches.groups && matches.groups.body) {
    return matches.groups.body;
  }
  return "";
};

export const parseBody = (payload: string) => {
  let matches = bodyTagInclusive.exec(payload);
  if (matches && matches.groups && matches.groups.body) {
    return matches.groups.body;
  }
  return "";
};

export const parseFooter = (payload: string) => {
  let matches = footerTagInclusive.exec(payload);
  if (matches && matches.groups && matches.groups.body) {
    return matches.groups.body;
  }
  return "";
};

export const parseMeta = (payload: string) => {
  let matches = payload.matchAll(metaTagInclusive);
  let metaTags: MetaHTMLTag[] = [];
  if (matches) {
    for (const match of matches) {
      if (match[1]) {
        let att: any = {};
        let m;
        while ((m = attributeSeperator.exec(match[1])) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === attributeSeperator.lastIndex) {
            attributeSeperator.lastIndex++;
          }
          if (m.groups && m.groups.attribute && m.groups.value) {
            att[m.groups.attribute] = m.groups.value;
          }
        }
        try {
          metaTags.push({
            attribute: HTMLTagName.meta,
            charset: att.charset ? att.charset : undefined,
            content: att.content ? att.content : undefined,
            name: att.name ? att.name : undefined,
          });
        } catch (error) {
          console.log(`Could not parse meta`);
        }
      }
    }
  }
  return metaTags;
};

export const parseImages = (payload: string) => {
  let matches = payload.matchAll(imageTagInclusive);
  let imageTags: ImgHTMLTag[] = [];
  if (matches) {
    for (const match of matches) {
      if (match[1]) {
        let att: any = {};
        let m;
        while ((m = attributeSeperator.exec(match[1])) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === attributeSeperator.lastIndex) {
            attributeSeperator.lastIndex++;
          }
          if (m.groups && m.groups.attribute && m.groups.value) {
            att[m.groups.attribute] = m.groups.value;
          }
        }
        try {
          imageTags.push({
            attribute: HTMLTagName.img,
            src: att.src ? att.src : undefined,
            alt: att.alt ? att.alt : undefined,
            height: att.height ? att.height : undefined,
            width: att.width ? att.width : undefined,
          });
        } catch (error) {
          console.log(`Could not parse images`);
        }
      }
    }
  }
  return imageTags;
};

export const parseVideos = (payload: string) => {
  let matches = payload.matchAll(videoTagInclusive);
  let videoTags: VideoHTMLTag[] = [];
  if (matches) {
    for (const match of matches) {
      if (match[1]) {
        let att: any = {};
        let m;
        while ((m = attributeSeperator.exec(match[1])) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === attributeSeperator.lastIndex) {
            attributeSeperator.lastIndex++;
          }
          if (m.groups && m.groups.attribute && m.groups.value) {
            att[m.groups.attribute] = m.groups.value;
          }
        }
        try {
          videoTags.push({
            attribute: HTMLTagName.video,
            autoplay: att.autoplay ? att.autoplay : undefined,
            controls: att.controls ? att.controls : undefined,
            loop: att.loop ? att.loop : undefined,
            poster: att.poster ? att.poster : undefined,
            src: att.src ? att.src : undefined,
            height: att.height ? att.height : undefined,
            width: att.width ? att.width : undefined,
          });
        } catch (error) {
          console.log(`Could not parse videos`);
        }
      }
    }
  }
  return videoTags;
};

export const parseLinks = (payload: string) => {
  let matches = payload.matchAll(linkTagInclusive);
  let linkTags: LinkHTMLTag[] = [];
  if (matches) {
    for (const match of matches) {
      if (match[1]) {
        let att: any = {};
        let m;
        while ((m = attributeSeperator.exec(match[1])) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === attributeSeperator.lastIndex) {
            attributeSeperator.lastIndex++;
          }
          if (m.groups && m.groups.attribute && m.groups.value) {
            att[m.groups.attribute] = m.groups.value;
          }
        }
        try {
          linkTags.push({
            attribute: HTMLTagName.link,
            href: att.href ? att.href : undefined,
            crossorigin: att.crossorigin ? att.crossorigin : undefined,
            rel: att.rel ? att.rel : undefined,
            type: att.type ? att.type : undefined,
          });
        } catch (error) {
          console.log(`Could not parse videos`);
        }
      }
    }
  }
  return linkTags;
};

export const parseStyles = (payload: string) => {
  let matches = payload.matchAll(styleTagInclusive);
  let styleTags: StyleHTMLTag[] = [];
  if (matches) {
    for (const match of matches) {
      if (match[1]) {
        let att: any = {};
        let m;
        while ((m = attributeSeperator.exec(match[1])) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === attributeSeperator.lastIndex) {
            attributeSeperator.lastIndex++;
          }
          if (m.groups && m.groups.attribute && m.groups.value) {
            att[m.groups.attribute] = m.groups.value;
          }
        }
        try {
          styleTags.push({
            attribute: HTMLTagName.style,
            type: att.type ? att.type : undefined,
            body: match?.groups?.body ? match.groups.body : undefined,
          });
        } catch (error) {
          console.log(`Could not parse styles`);
        }
      }
    }
  }
  return styleTags;
};

export const parseScripts = (payload: string) => {
  let matches = payload.matchAll(scriptTagInclusive);
  let scriptTags: ScriptHTMLTag[] = [];
  if (matches) {
    for (const match of matches) {
      if (match[1]) {
        let att: any = {};
        let m;
        while ((m = attributeSeperator.exec(match[1])) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === attributeSeperator.lastIndex) {
            attributeSeperator.lastIndex++;
          }
          if (m.groups && m.groups.attribute && m.groups.value) {
            att[m.groups.attribute] = m.groups.value;
          }
        }
        try {
          scriptTags.push({
            attribute: HTMLTagName.script,
            type: att.type ? att.type : undefined,
            async: att.async ? att.async : undefined,
            crossorigin: att.crossorigin ? att.crossorigin : undefined,
            defer: att.defer ? att.defer : undefined,
            integrity: att.integrity ? att.integrity : undefined,
            src: att.src ? att.src : undefined,
            body: match?.groups?.body ? match.groups.body : undefined,
          });
        } catch (error) {
          console.log(`Could not parse styles`);
        }
      }
    }
  }
  return scriptTags;
};

export const parseAnchors = (payload: string) => {
  let matches = payload.matchAll(anchorTagInclusive);
  let anchorTags: AnchorHTMLTag[] = [];
  if (matches) {
    for (const match of matches) {
      if (match[1]) {
        let att: any = {};
        let m;
        while ((m = attributeSeperator.exec(match[1])) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === attributeSeperator.lastIndex) {
            attributeSeperator.lastIndex++;
          }
          if (m.groups && m.groups.attribute && m.groups.value) {
            att[m.groups.attribute] = m.groups.value;
          }
        }
        try {
          anchorTags.push({
            attribute: HTMLTagName.a,
            href: att.href ? att.href : undefined,
            download: att.download ? att.download : undefined,
            target: att.target ? att.target : undefined,
            type: att.type ? att.type : undefined,
            body: match?.groups?.body ? match.groups.body : undefined,
          });
        } catch (error) {
          console.log(`Could not parse videos`);
        }
      }
    }
  }
  return anchorTags;
};

export const findSentenceWithWord = (payload: string, searchedTerm: string) => {
  const searchPatternStart = `[^.?!]*(?<=[.?\\s!])`;
  const searchPatternEnd = `(?=[\\s.?!])[^.?!]*[.?!]`;
  const pattern = new RegExp(
    `${searchPatternStart}${searchedTerm}${searchPatternEnd}`,
    "igm"
  );
  let results: string[] = [];
  const matches = payload.matchAll(pattern);
  if (matches) {
    for (const match of matches) {
      if (match[0]) {
        results.push(match[0].trim());
      }
    }
  }
  return results;
};

export const parseTables = (payload: string) => {
  // Reset regex before using it to avoid lastIndex issues
  tableTagInclusive.lastIndex = 0;
  attributeSeperator.lastIndex = 0;
  
  let matches = payload.matchAll(tableTagInclusive);
  let tableTags: TableHTMLTag[] = [];
  
  if (matches) {
    for (const match of matches) {
      // Process both tables with and without attributes
      let att: any = {};
      
      // If we have attributes, process them
      if (match[1]) {
        let m;
        attributeSeperator.lastIndex = 0;
        
        while ((m = attributeSeperator.exec(match[1])) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === attributeSeperator.lastIndex) {
            attributeSeperator.lastIndex++;
          }
          if (m.groups && m.groups.attribute && m.groups.value) {
            att[m.groups.attribute] = m.groups.value;
          }
        }
      }
      
      try {
        const bodyContent = match?.groups?.body;
        const rawHtml = match[0];
        
        // Extract headers and rows from the table
        const { headers, rows } = extractTableContent(bodyContent || '');
        
        tableTags.push({
          attribute: HTMLTagName.table,
          id: att.id ? att.id : undefined,
          class: att.class ? att.class : undefined,
          title: att.title ? att.title : undefined,
          body: bodyContent,
          headers: headers,
          rows: rows,
          rawHtml: rawHtml
        });
      } catch (error) {
        console.log(`Could not parse tables:`, error);
      }
    }
  }
  
  return tableTags;
};



/**
 * Extract headers and rows from table HTML content
 */
const extractTableContent = (tableBody: string): { headers: TableRow[], rows: TableRow[] } => {
  const headers: TableRow[] = [];
  const rows: TableRow[] = [];
  
  try {
    // Extract thead content if it exists
    const theadMatch = tableBody.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
    if (theadMatch && theadMatch[1]) {
      const theadContent = theadMatch[1];
      // Extract rows from thead
      const headerRowMatches = theadContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      if (headerRowMatches) {
        for (const rowMatch of headerRowMatches) {
          if (rowMatch[1]) {
            const rowContent = rowMatch[1];
            const cells: TableCell[] = [];
            
            // Try to extract cells (th or td)
            const cellMatches = rowContent.matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/gi);
            if (cellMatches) {
              let hasCells = false;
              for (const cellMatch of cellMatches) {
                hasCells = true;
                const cellContent = cellMatch[2] ? cellMatch[2].trim() : '';
                const cellTag = cellMatch[0];
                
                // Extract colspan and rowspan if they exist
                const colSpanMatch = cellTag.match(/colspan=["']?(\d+)["']?/i);
                const rowSpanMatch = cellTag.match(/rowspan=["']?(\d+)["']?/i);
                
                cells.push({
                  content: cellContent,
                  originalHtml: cellTag,
                  text: getInnermostText(cellContent),
                  colSpan: colSpanMatch ? parseInt(colSpanMatch[1]) : undefined,
                  rowSpan: rowSpanMatch ? parseInt(rowSpanMatch[1]) : undefined
                });
              }
              
              // If no explicit cells but the row has content, use the whole row content
              if (!hasCells && rowContent.trim()) {
                cells.push({
                  content: stripTags(rowContent).trim(),
                  originalHtml: rowContent,
                  text: getInnermostText(rowContent)
                });
              }
            } else if (rowContent.trim()) {
              // Handle case where there are no th/td tags but text content exists
              cells.push({
                content: stripTags(rowContent).trim(),
                originalHtml: rowContent,
                text: getInnermostText(rowContent)
              });
            }
            
            if (cells.length > 0) {
              headers.push({ cells });
            }
          }
        }
      }
    }
    
    // Extract tbody content if it exists
    const tbodyMatch = tableBody.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    if (tbodyMatch && tbodyMatch[1]) {
      const tbodyContent = tbodyMatch[1];
      // Extract rows from tbody
      const rowMatches = tbodyContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      if (rowMatches) {
        for (const rowMatch of rowMatches) {
          if (rowMatch[1]) {
            const rowContent = rowMatch[1];
            const cells: TableCell[] = [];
            
            // Extract cells from row
            const cellMatches = rowContent.matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/gi);
            if (cellMatches) {
              for (const cellMatch of cellMatches) {
                const cellContent = cellMatch[2] ? cellMatch[2].trim() : '';
                const cellTag = cellMatch[0];
                
                // Extract colspan and rowspan if they exist
                const colSpanMatch = cellTag.match(/colspan=["']?(\d+)["']?/i);
                const rowSpanMatch = cellTag.match(/rowspan=["']?(\d+)["']?/i);
                
                cells.push({
                  content: cellContent,
                  originalHtml: cellTag,
                  text: getInnermostText(cellContent),
                  colSpan: colSpanMatch ? parseInt(colSpanMatch[1]) : undefined,
                  rowSpan: rowSpanMatch ? parseInt(rowSpanMatch[1]) : undefined
                });
              }
            }
            
            if (cells.length > 0) {
              rows.push({ cells });
            }
          }
        }
      }
    }
    
    // If no tbody was found, try to extract rows directly from the table
    if (rows.length === 0 && headers.length === 0) {
      // Look for tr tags directly in the table content
      const directRowMatches = tableBody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      if (directRowMatches) {
        for (const rowMatch of directRowMatches) {
          if (rowMatch[1]) {
            const rowContent = rowMatch[1];
            const cells: TableCell[] = [];
            
            // Extract cells from row
            const cellMatches = rowContent.matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/gi);
            if (cellMatches) {
              for (const cellMatch of cellMatches) {
                const cellContent = cellMatch[2] ? cellMatch[2].trim() : '';
                const cellTag = cellMatch[0];
                
                // Extract colspan and rowspan if they exist
                const colSpanMatch = cellTag.match(/colspan=["']?(\d+)["']?/i);
                const rowSpanMatch = cellTag.match(/rowspan=["']?(\d+)["']?/i);
                
                cells.push({
                  content: cellContent,
                  originalHtml: cellTag,
                  text: getInnermostText(cellContent),
                  colSpan: colSpanMatch ? parseInt(colSpanMatch[1]) : undefined,
                  rowSpan: rowSpanMatch ? parseInt(rowSpanMatch[1]) : undefined
                });
              }
            }
            
            if (cells.length > 0) {
              rows.push({ cells });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error parsing table content:', error);
  }
  
  return { headers, rows };
};

/**
 * Helper function to strip HTML tags from a string
 */
const stripTags = (html: string): string => {
  return html.replace(/<\/?[^>]+(>|$)/g, '');
};

/**
 * Extract the innermost text from HTML content, removing all tags
 */
const getInnermostText = (html: string): string => {
  // First strip all HTML tags
  const stripped = stripTags(html);
  // Then trim and normalize whitespace
  return stripped.trim().replace(/\s+/g, ' ');
};

export interface ExtractedFiles {
  totalFiles: number;
  totalDownloaded: number;
  fileNames: string[];
  errors: any[];
}

export interface ParsedPage {
  title: string;
  head: string;
  body: string;
  footer: string;
  meta: MetaHTMLTag[];
  media: {
    images: ImgHTMLTag[];
    videos: VideoHTMLTag[];
  };
  links: {
    links: LinkHTMLTag[];
    anchors: AnchorHTMLTag[];
  };
  styles: StyleHTMLTag[];
  scripts: ScriptHTMLTag[];
  tables: TableHTMLTag[];
}

export interface HTMLTag {
  attribute: HTMLTagName;
  id?: string | undefined;
  class?: string | undefined;
  body?: string | undefined;
  title?: string | undefined;
}

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

export interface StyleHTMLTag extends HTMLTag {
  attribute: HTMLTagName.style;
  type: string | undefined;
  body: string | undefined;
}

export interface LinkHTMLTag extends HTMLTag {
  attribute: HTMLTagName.link;
  href: string | undefined;
  crossorigin: string | undefined;
  rel: string | undefined;
  type: string | undefined;
  body?: undefined;
}

export interface MetaHTMLTag extends HTMLTag {
  attribute: HTMLTagName.meta;
  charset: string | undefined;
  content: string | undefined;
  name: string | undefined;
}

export interface ImgHTMLTag extends HTMLTag {
  attribute: HTMLTagName.img;
  src: string | undefined;
  alt: string | undefined;
  height: string | undefined;
  width: string | undefined;
  body?: undefined;
}

export interface AnchorHTMLTag extends HTMLTag {
  attribute: HTMLTagName.a;
  download: string | undefined;
  href: string | undefined;
  target: string | undefined;
  type: string | undefined;
}

export interface IframeHTMLTag extends HTMLTag {
  attribute: HTMLTagName.iframe;
  allow: string | undefined;
  allowfullscreen: string | undefined;
  allowpaymentrequest: string | undefined;
  height: string | undefined;
  width: string | undefined;
  name: string | undefined;
  src: string | undefined;
}

export interface SvgHTMLTag extends HTMLTag {
  attribute: HTMLTagName.svg;
  viewbox: string | undefined;
  x: string | undefined;
  y: string | undefined;
  version: string | undefined;
  height: string | undefined;
  width: string | undefined;
}

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

export interface TableCell {
  content: string;
  originalHtml: string;
  text: string;
  colSpan?: number;
  rowSpan?: number;
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableHTMLTag extends HTMLTag {
  attribute: HTMLTagName.table;
  body: string | undefined;
  headers: TableRow[];
  rows: TableRow[];
  rawHtml: string | undefined;
}

export interface TableBodyHTMLTag extends HTMLTag {
  attribute: HTMLTagName.tbody;
  body: string | undefined;
}

export enum HTMLTagName {
  "a" = "a",
  "abbr" = "abbr",
  "address" = "address",
  "area" = "area",
  "article" = "article",
  "aside" = "aside",
  "audio" = "audio",
  "b" = "b",
  "base" = "base",
  "bdi" = "bdi",
  "bdo" = '"bdo',
  "blockquote" = "blockquote",
  "body" = "body",
  "br" = "br",
  "button" = "button",
  "canvas" = "canvas",
  "caption" = "caption",
  "cite" = "cite",
  "code" = "code",
  "col" = "col",
  "colgroup" = "colgroup",
  "data" = "data",
  "datalist" = "datalist",
  "dd" = "dd",
  "del" = "del",
  "details" = "details",
  "dfn" = "dfn",
  "dialog" = "dialog",
  "div" = "div",
  "dl" = "dl",
  "dt" = "dt",
  "em" = "em",
  "embed" = "embed",
  "fieldset" = "fieldset",
  "figcaption" = "figcaption",
  "figure" = "figure",
  "footer" = "footer",
  "form" = "form",
  "h1" = "h1",
  "h2" = "h2",
  "h3" = "h3",
  "h4" = "h4",
  "h5" = "h5",
  "h6" = "h6",
  "head" = "head",
  "header" = "header",
  "hgroup" = "hgroup",
  "hr" = "hr",
  "html" = "html",
  "i" = "i",
  "iframe" = "iframe",
  "img" = "img",
  "input" = "input",
  "ins" = "ins",
  "kbd" = "kbd",
  "label" = "label",
  "legend" = "legend",
  "li" = "li",
  "link" = "link",
  "main" = "main",
  "map" = "map",
  "mark" = "mark",
  "math" = "math",
  "menu" = "menu",
  "menuitem" = "menuitem",
  "meta" = "meta",
  "meter" = "meter",
  "nav" = "nav",
  "noscript" = "noscript",
  "object" = "object",
  "ol" = "ol",
  "optgroup" = "optgroup",
  "option" = "option",
  "output" = "output",
  "p" = "p",
  "param" = "param",
  "picture" = "picture",
  "pre" = "pre",
  "progress" = "progress",
  "q" = "q",
  "rb" = "rb",
  "rp" = "rp",
  "rt" = "rt",
  "rtc" = "rtc",
  "ruby" = "ruby",
  "s" = "s",
  "samp" = "samp",
  "script" = "script",
  "section" = "section",
  "select" = "select",
  "slot" = "slot",
  "small" = "small",
  "source" = "source",
  "span" = "span",
  "strong" = "strong",
  "style" = "style",
  "sub" = "sub",
  "summary" = "summary",
  "sup" = "sup",
  "svg" = "svg",
  "table" = "table",
  "tbody" = "tbody",
  "td" = "td",
  "template" = "template",
  "textarea" = "textarea",
  "tfoot" = "tfoot",
  "th" = "th",
  "thead" = "thead",
  "time" = "time",
  "title" = "title",
  "tr" = "tr",
  "track" = "track",
  "u" = "u",
  "ul" = "ul",
  "var" = "var",
  "video" = "video",
  "wbr" = "wbr",
}
