import * as colors from 'twind/colors';
import typography from '@twind/typography';
import config from '$config';
import { getMarkdownClassName } from '$root/scripts/markdown-class.ts';

const { cssFontList } = config;

const markdownClass = await getMarkdownClassName();

/** @type {import("twind").Configuration} */
const twindConfig = {
  mode: 'warn',
  theme: {
    // This doesn't work
    extend: {
      colors,
      fontFamily: Object.fromEntries(
        cssFontList.flatMap((cssFont) => {
          if (cssFont.needFontFace) {
            return cssFont.fontFamily;
          } else {
            return cssFont.fontNameList;
          }
        }).map((fontName) => [fontName, fontName]),
      ),
      // typography: {
      //   DEFAULT: {
      //     css: {},
      //   },
      // },
    },
  },
  // This doesn't work
  preflight: (preflight) => {
    console.log(preflight);
    return {
      ...preflight,
      body: {
        backgroundColor: 'moccasin',
      },
      '@import': cssFontList.filter((cssFontInfo) =>
        !(cssFontInfo.needFontFace)
      ).map((cssFontInfo) => cssFontInfo.url),
      '@font-face': cssFontList.filter((cssFontInfo) =>
        Boolean(cssFontInfo.needFontFace)
      ).map(
        (cssFontInfo) => ({
          fontFamily: cssFontInfo.fontFamily,
          fontWeight: cssFontInfo.fontWeight,
          fontStyle: cssFontInfo.fontStyle,
          fontStretch: cssFontInfo.fontStretch,
          fontDisplay: cssFontInfo.fontDisplay,
          unicodeRange: cssFontInfo.codeRange,
          src: cssFontInfo.src.map(
            ({ url, fontFormat = 'truetype' }) =>
              `url(${url}) format('${fontFormat}')`,
          )
            .join(','),
        }),
      ),
    };
  },
  plugins: {
    // This doesn't work
    ...typography({
      className: markdownClass,
    }),
  },
};

/** @type {import("$fresh/plugins/twind.ts").Options} */
export default twindConfig;
