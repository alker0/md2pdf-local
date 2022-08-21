import { extract } from 'extract-class';

const fallbackClassName = 'markdown';

let extractMarkdownClassName = async (): Promise<string> => {
  const url = new URL(`../static/markdown.css`, import.meta.url);
  try {
    const cssText = await Deno.readTextFile(url);
    const extracted = extract(cssText);

    let result = extracted.res.find((maybeClassName) =>
      maybeClassName.startsWith('.')
    );
    if (typeof result === 'string') {
      result = result.replace(/^\./, '');
    } else {
      result = fallbackClassName;
    }

    const resultPromise = Promise.resolve(result);

    extractMarkdownClassName = () => resultPromise;

    return result;
  } catch (error) {
    console.error(error);
    return fallbackClassName;
  }
};

export const getMarkdownClassName = extractMarkdownClassName;
