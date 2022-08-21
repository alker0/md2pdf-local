import { CSSRules } from 'twind';
import config from '$config';
import { CssFontFaceInfoForTwind, CssFontImportInfo } from './font-utils.ts';

export type GlobalStyle = NonNullable<CSSRules[':global']>;

const { cssFontList } = config;

export function getGlobalStyle(): GlobalStyle {
  const importUrlList: CSSRules['@import'] = cssFontList.filter((
    cssFontInfo,
  ) => !cssFontInfo.needFontFace)
    .map((cssFontInfo) => `url('${(cssFontInfo as CssFontImportInfo).url}')`);

  const fontFaceList: CSSRules['@font-face'] = cssFontList.filter((
    cssFontInfo,
  ) => cssFontInfo.needFontFace === true)
    .map(
      (cssFontInfo) => {
        const {
          fontFamily,
          fontStyle,
          fontWeight,
          fontStretch,
          fontDisplay,
          codeRange: unicodeRange,
          src,
        } = cssFontInfo as CssFontFaceInfoForTwind;
        return {
          fontFamily,
          fontStyle,
          fontWeight,
          fontStretch,
          fontDisplay,
          unicodeRange,
          src: src.map(
            ({ url, fontFormat = 'truetype' }) =>
              `url(${url}) format('${fontFormat}')`,
          )
            .join(','),
        };
      },
    );

  return {
    body: {
      backgroundColor: 'moccasin',
    },
    '@import': importUrlList,
    '@font-face': fontFaceList,
  };
}
