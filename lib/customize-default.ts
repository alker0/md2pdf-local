// import { Md2PdfConfig } from '$root/lib/customize-default.ts';
import { emojiCodeRange } from '$root/lib/font-utils.ts';

// _ Replace with /\s*=/: Md2PdfConfig =/
const config = {
  pageTitle: {
    default: 'markdown',
    prefix: 'MD - ',
  },
  topArraySelector: ':scope > h1, :scope > h2, :scope > h3',
  md2pdfIgnoreSelector: 'iframe, video, input, textarea',
  pdfQuality: 0.85,
  fixMarkdownInput(mdInput: string): string {
    // Fix list
    return mdInput
      .replaceAll(/(\n- [^\n]*\n)([^-#\s][^\n]*)/g, '$1\n$2')
      .replaceAll(/(\n\d+\. [^\n]*\n)([^\d#\s][^\n]*)/g, '$1\n$2');
  },
  // _ Copy end
};

function withCssFontList<T>(target: T): asserts target is typeof target & {
  cssFontList: import('$root/lib/font-utils.ts').CssFontInfo[];
} {
}

withCssFontList(config);

Object.assign(config, {
  // _ Copy start
  cssFontList: [
    {
      fontFamily: 'Twemoji',
      src: [{
        url: '/fonts/TwemojiMozilla.ttf',
        fontFormat: 'truetype',
        downloadUrl:
          'https://github.com/mozilla/twemoji-colr/releases/latest/download/TwemojiMozilla.ttf',
      }],
      needFontFace: true,
      codeRange: emojiCodeRange,
    },
    {
      fontNameList: ['Noto Sans JP', 'Roboto'],
      url: `https://fonts.googleapis.com/css2?${
        [
          'Noto+Sans+JP:wght@400;700',
          'Roboto',
        ]
          .map((name) => `family=${name}`)
          .join('&')
      }&display=swap`,
    },
  ],
  // _ Copy end with }
});

export type Md2PdfConfig = typeof config;

// _ Copy start

export default config;
