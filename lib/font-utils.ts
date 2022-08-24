import type { HTMLFontFace } from 'jspdf';
import config from '$config';

export type FixedHTMLFontFace = Required<HTMLFontFace>;

export type FixedFontDefinition = Required<FontDefinition>;

export type HTMLFontWeight = FixedHTMLFontFace['weight'];
export type HTMLFontStyle = FixedHTMLFontFace['style'];
export type HTMLFontStretch = FixedHTMLFontFace['stretch'];

export const fontStretchMap: Record<FixedHTMLFontFace['stretch'], number> = {
  'ultra-condensed': 50,
  'extra-condensed': 62.5,
  'condensed': 75,
  'semi-condensed': 87.5,
  'normal': 100,
  'semi-expanded': 112.5,
  'expanded': 120,
  'extra-expanded': 150,
  'ultra-expanded': 200,
};

export const fontWeightNumberList: Readonly<Extract<HTMLFontWeight, number>[]> =
  [
    100,
    200,
    300,
    400,
    500,
    600,
    700,
    800,
    900,
  ] as const;

export type FontStretchRangePart =
  | FixedHTMLFontFace['stretch']
  | `${number}%`;

export type FontWeightRangePart =
  | FixedHTMLFontFace['weight']
  | '1'
  | '999'
  | number;

export interface FontDefinition {
  'font-display'?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  'font-family': string;
  'font-stretch'?: `${FontStretchRangePart}${
    | ''
    | ` ${FontStretchRangePart}`}`;
  'font-style'?: string;
  'font-weight'?: `${FontWeightRangePart}${
    | ''
    | ` ${FontWeightRangePart}`}`;
  src: string;
  'unicode-range'?: string;
}

export type FontFormat =
  | 'truetype'
  | 'opentype'
  | 'embedded-opentype'
  | 'woff'
  | 'woff2'
  | 'svg';

export type PdfFontStyle = 'normal' | 'bold' | 'italic' | 'italicbold';
export type PdfFont = {
  fileData: string;
  fileName: string;
  fontName: string;
  fontStyle: PdfFontStyle;
  isDefault?: boolean;
};

export const pdfFontList: PdfFont[] = [];

export type CssFontFaceSrcItem = {
  url: string;
  fontFormat?: FontFormat;
  downloadUrl?: string;
};

export type CssFontFaceInfo = {
  needFontFace: true;
  fontFamily: FontDefinition['font-family'];
  src: CssFontFaceSrcItem[];
  fontStyle?: FontDefinition['font-style'];
  fontWeight?: FontDefinition['font-weight'];
  fontStretch?: FontDefinition['font-stretch'];
  codeRange?: FontDefinition['unicode-range'];
  fontDisplay?: FontDefinition['font-display'];
};

export type CssFontImportInfo = {
  needFontFace?: false;
  fontNameList: string[];
  url: string;
};

export type CssFontInfo = CssFontFaceInfo | CssFontImportInfo;

export type CssFontFaceInfoForTwind = Omit<CssFontFaceInfo, 'fontStyle'> & {
  fontStyle?: HTMLFontStyle;
};

export type CssFontInfoForTwind = CssFontFaceInfoForTwind | CssFontImportInfo;

export const emojiCodeRange = [
  'U+00A9',
  'U+00AE',
  'U+203C',
  'U+2049',
  'U+2122',
  'U+2139',
  'U+2194-2199',
  'U+21A9',
  'U+21AA',
  'U+231A-23FA',
  'U+24C2',
  'U+25AA-25FE',
  'U+2600-26FD',
  'U+2702-27BF',
  'U+2934',
  'U+2935',
  'U+2B05-2B55',
  'U+3030',
  'U+303D',
  'U+3297',
  'U+3299',
  'U+1F004-1FA95',
].join(', ');

export function getFontNameList() {
  return Array.from(
    new Set(config.cssFontList.flatMap((cssFontInfo) => {
      if (cssFontInfo.needFontFace === true) {
        return cssFontInfo.fontFamily;
      } else {
        return cssFontInfo.fontNameList;
      }
    })),
  );
}
