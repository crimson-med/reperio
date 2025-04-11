import { readFileSync } from "fs";
import { findSentenceWithWord, Parser, parserFromUrl } from "../Parser";
// Use Bun's timeout settings instead of Jest's
// jest.setTimeout(30000);
const data = readFileSync("./src/examples/woocommerce.html", "utf-8");
if (data) {
  const parser = new Parser(data);
  describe("Parser Class", () => {
    test("Parser Title", () => {
      expect(parser.parsedPage.title).toEqual("Products – ScrapeMe");
    });

    test("Parser Payload", () => {
      expect(parser.payload.length).toEqual(49785);
    });

    test("Parser Head", () => {
      expect(parser.parsedPage.head.length).toEqual(13689);
    });

    test("Parser Body", () => {
      expect(parser.parsedPage.body.length).toEqual(35897);
    });

    test("Parser Footer", () => {
      expect(parser.parsedPage.footer.length).toEqual(45014);
    });

    test("Parser Meta", () => {
      expect(parser.parsedPage.meta.length).toEqual(4);
    });

    test("Parser Media Images", () => {
      expect(parser.parsedPage.media.images.length).toEqual(16);
    });

    test("Parser Media Videos", () => {
      expect(parser.parsedPage.media.videos.length).toEqual(0);
    });

    test("Parser Links Links", () => {
      expect(parser.parsedPage.links.links.length).toEqual(21);
    });

    test("Parser Links Anchors", () => {
      expect(parser.parsedPage.links.anchors.length).toEqual(59);
    });

    test("Parser Styles", () => {
      expect(parser.parsedPage.styles.length).toEqual(5);
    });

    test("Parser Scripts", () => {
      expect(parser.parsedPage.scripts.length).toEqual(22);
    });

    test("Parser Tables", () => {
      expect(parser.parsedPage.tables.length).toEqual(1);
    });
  });

  describe("Extract Functions", () => {
    test("Extract Urls", () => {
      expect(parser.extractUrls().length).toEqual(97);
    });
    test("Extract Tables To Object", () => {
      const tableData = parser.extractTablesToObject();
      expect(Array.isArray(tableData)).toBe(true);
      expect(tableData.length).toBeGreaterThan(0);
      expect(tableData[0]).toBeInstanceOf(Object);
    });
  });

  describe("Find Functions", () => {
    const para = `As she did so, a most extraordinary thing happened. Some random sentence with flung in it. The bed-clothes gathered themselves together, leapt up suddenly into a sort of peak, and then jumped headlong over the bottom rail. It was exactly as if a hand had clutched them in the centre and flung them aside. Immediately after, .........`;
    const foundSentences = findSentenceWithWord(para, "flung");
    test("Find Sentence With Word", () => {
      expect(foundSentences.length).toEqual(2);
      expect(foundSentences[0]).toEqual(
        "Some random sentence with flung in it."
      );
      expect(foundSentences[1]).toEqual(
        "It was exactly as if a hand had clutched them in the centre and flung them aside."
      );
    });
  });

  describe("Parser From Url", () => {
    test("No Error", () => {
      return parserFromUrl("https://scrapeme.live/shop/").then(
        ({ error, parser }) => {
          expect(parser).not.toBeNull();
          expect(parser?.parsedPage.media.images.length).toEqual(16);
          expect(error).toBe(undefined);
        }
      );
    });
  });

  //TODO: Add the test for a Parser built from URL
}
