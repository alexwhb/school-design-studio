export declare function cx(...parts: (string | false | null | undefined | Record<string, boolean | undefined>)[]): string;
export declare function setTransformAttribute(el: HTMLElement, attrName: string, value: string | number): void;
/**
 * Markup parsed where nothing in it can run or load.
 *
 * Setting innerHTML on a detached `<div>` does not run a `<script>`, but it
 * does start loading images — so `<img src=x onerror=…>` in a design's text
 * fires its handler the moment the text is read for its words, whether or not
 * the element ever reaches the page. A document from DOMParser has no browsing
 * context: nothing in it is fetched and no handler in it ever runs.
 * `richText.ts` reads the same way.
 *
 * The leading `<body>` keeps a string that starts with `<title>` or `<meta>`
 * in the body rather than letting the parser move it into the head.
 */
export declare function parseInert(html: string): HTMLElement;
