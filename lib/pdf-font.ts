import {
  FixedFontDefinition,
  FontDefinition,
  FontFormat,
  fontStretchMap,
  FontStretchRangePart,
  fontWeightNumberList,
  FontWeightRangePart,
  HTMLFontStretch,
  HTMLFontStyle,
  HTMLFontWeight,
  pdfFontList,
} from './font-utils.ts';
import type * as jspdfType from 'jspdf';
import config from '$config';

declare global {
  interface ObjectConstructor {
    hasOwn<I extends unknown, K extends unknown>(
      instance: I,
      prop: K,
      // @ts-expect-error It should be collect.
    ): prop is keyof I;
    entries<K extends string | number | symbol, V>(
      target: Record<K, V>,
    ): [K, V][];
  }
}

interface CSSFontFaceRule extends CSSRule {
  readonly style: {
    getPropertyValue<T extends keyof FontDefinition>(
      key: T,
    ): FontDefinition[T] extends undefined ? FixedFontDefinition[T] | ''
      : FixedFontDefinition[T];
  };
}

function isFontFaceRule(cssRule: CSSRule): cssRule is CSSFontFaceRule {
  return cssRule.constructor.name === 'CSSFontFaceRule';
}

interface FontSource {
  url: string;
  format: FontFormat;
  stretch?: HTMLFontStretch;
}

type FontStretch2Src = Record<HTMLFontStretch, FontSource[]>;
type FontWeight2Stretch2Src = Record<HTMLFontWeight, FontStretch2Src>;
type FontStyle2Weight2Stretch2Src = Record<
  HTMLFontStyle,
  FontWeight2Stretch2Src
>;
type FontName2Style2Weight2Stretch2Src = Record<
  string,
  FontStyle2Weight2Stretch2Src
>;

const fontFamilyRegex = /^['"]?([^'"]+)['"]?$/;
const fontStyleRegex = /^\s*(\w+)/;
const fontWeightRegex = /^\s*(\w+)(?:\s+(\w+))?/;
const fontStretchRegex = /^\s*(\w+)(?:\s+(\w+))?/;
const fontSourceRegex =
  /url\(['"]?(?<url>[^'"()]+)['"]?\)\s*format\(['"]?(?<format>[^'"()]+)['"]?\)/g;

export function getFontFaceList(doc: Document) {
  const fontFamily2Style2Weight2Src = Array.from(doc.styleSheets).reduce(
    (result, styleSheet) => {
      if (typeof styleSheet.href !== 'string') {
        return result;
      }

      for (const cssRule of styleSheet.cssRules) {
        if (!isFontFaceRule(cssRule)) {
          continue;
        }

        const { style } = cssRule;

        const fontFamilyRaw = style.getPropertyValue('font-family');
        const fontFamily = fontFamilyRaw.match(fontFamilyRegex)?.[1];
        if (typeof fontFamily !== 'string') {
          continue;
        }

        let fontStyle2Weight2Stretch2Src = result[fontFamily];
        if (typeof fontStyle2Weight2Stretch2Src !== 'object') {
          fontStyle2Weight2Stretch2Src = {} as FontStyle2Weight2Stretch2Src;
          result[fontFamily] = fontStyle2Weight2Stretch2Src;
        }

        const fontStyleDef = style.getPropertyValue('font-style');
        let fontStyle: HTMLFontStyle = 'normal';
        if (fontStyleDef !== '') {
          const fontStyleMatches = fontStyleDef.match(fontStyleRegex);
          if (!Array.isArray(fontStyleMatches)) {
            continue;
          }
          fontStyle = fontStyleMatches[1] as HTMLFontStyle;
        }

        const fontWeightDef = style.getPropertyValue('font-weight') as
          | FixedFontDefinition['font-weight']
          | '';
        const fontWeightList: HTMLFontWeight[] = [];
        if (fontWeightDef === '') {
          fontWeightList.push('400');
        } else {
          const fontWeightMatches = fontWeightDef.match(fontWeightRegex);
          if (!Array.isArray(fontWeightMatches)) {
            continue;
          }

          if (typeof fontWeightMatches[2] !== 'string') {
            fontWeightList.push(fontWeightMatches[1] as HTMLFontWeight);
          } else {
            const fontWeightRangeTextPair = fontWeightMatches.slice(
              1,
            ) as Extract<FontWeightRangePart, string>[];
            const [weightStart, weightEnd] = fontWeightRangeTextPair.map(
              (weightRangePart) => {
                if (weightRangePart === 'normal') {
                  return 400;
                }
                if (weightRangePart === 'bold') {
                  return 700;
                }
                return Number(weightRangePart);
              },
            );
            fontWeightList.push(
              ...fontWeightNumberList
                .filter((weight) =>
                  weightStart <= weight && weight <= weightEnd
                ),
            );
          }
        }

        const fontStretchDef = style.getPropertyValue('font-stretch') as
          | FixedFontDefinition['font-stretch']
          | '';
        const fontStretchList: HTMLFontStretch[] = [];
        if (fontStretchDef === '') {
          fontStretchList.push('normal');
        } else {
          const fontStretchMatches = fontStretchDef.match(fontStretchRegex);
          if (!Array.isArray(fontStretchMatches)) {
            continue;
          }

          if (typeof fontStretchMatches[2] !== 'string') {
            fontStretchList.push(fontStretchMatches[1] as HTMLFontStretch);
          } else {
            const fontStretchRangeTextPair = fontStretchMatches.slice(
              1,
            ) as Extract<FontStretchRangePart, string>[];
            const [stretchStart, stretchEnd] = fontStretchRangeTextPair.map(
              (stretchRangePart) => {
                if (Object.hasOwn(fontStretchMap, stretchRangePart)) {
                  return fontStretchMap[stretchRangePart];
                }

                return Number(stretchRangePart.replaceAll(/\D/g, ''));
              },
            );
            fontStretchList.push(
              ...Object.entries(fontStretchMap)
                .filter(([, stretch]) =>
                  stretchStart <= stretch && stretch <= stretchEnd
                ).map(([key]) => key),
            );
          }
        }

        let fontWeight2Stretch2Src = fontStyle2Weight2Stretch2Src[fontStyle];
        if (typeof fontWeight2Stretch2Src !== 'object') {
          fontWeight2Stretch2Src = {} as FontWeight2Stretch2Src;
          fontStyle2Weight2Stretch2Src[fontStyle] = fontWeight2Stretch2Src;
        }

        for (const fontWeight of fontWeightList) {
          let fontStretch2Src = fontWeight2Stretch2Src[fontWeight];
          if (typeof fontStretch2Src !== 'object') {
            fontStretch2Src = {} as FontStretch2Src;
            fontWeight2Stretch2Src[fontWeight] = fontStretch2Src;
          }

          for (const fontStretch of fontStretchList) {
            let srcList = fontStretch2Src[fontStretch];
            if (!Array.isArray(srcList)) {
              srcList = [];
              fontStretch2Src[fontStretch] = srcList;
            }

            const src = style.getPropertyValue('src');
            if (src === '') {
              continue;
            }

            for (const { groups } of src.matchAll(fontSourceRegex)) {
              if (typeof groups !== 'object') {
                continue;
              }

              srcList.push({
                url: groups.url,
                format: groups.format as FontFormat,
              });
            }
          }
        }
      }

      return result;
    },
    {} as FontName2Style2Weight2Stretch2Src,
  );

  type FontLink = {
    family: string;
    src: FontSource[];
    style: HTMLFontStyle;
    weight: HTMLFontWeight;
    stretch?: HTMLFontStretch;
  };

  const fontLinkList = Object.entries(fontFamily2Style2Weight2Src).flatMap(
    ([family, style2Weight2Stretch2Src]) => {
      return Object.entries(style2Weight2Stretch2Src).flatMap(
        ([style, weight2Stretch2Src]) => {
          return Object.entries(weight2Stretch2Src).flatMap(
            ([weight, stretch2Src]) => {
              return Object.entries(stretch2Src).map(
                ([stretch, src]): FontLink => {
                  return {
                    family,
                    src,
                    stretch,
                    style,
                    weight,
                  };
                },
              );
            },
          );
        },
      );
    },
  );

  const { cssFontList } = config;

  const fontFaceList: jspdfType.HTMLFontFace[] = cssFontList.flatMap(
    (cssFontInfo) => {
      if (cssFontInfo.needFontFace === true) {
        return {
          family: cssFontInfo.fontFamily,
          src: cssFontInfo.src.map(({ url, fontFormat }) => ({
            url,
            format: (fontFormat as 'truetype') ?? 'truetype',
          })),
        };
      } else {
        return cssFontInfo.fontNameList.flatMap((fontName) => {
          return (fontLinkList as jspdfType.HTMLFontFace[])
            .filter(({ family }) => family === fontName)
            .map(({ src, style, weight, stretch }) => {
              return {
                family: fontName,
                style,
                weight,
                stretch,
                src,
              };
            });
        });
      }
    },
  );
  return fontFaceList;
}

export function initializePdfFont(jsPdf: typeof jspdfType) {
  const callAddFont = function (this: jspdfType.jsPDF) {
    // deno-lint-ignore no-this-alias
    const self = this;
    pdfFontList.forEach(({ fileName, fileData, fontName, fontStyle }) => {
      self.addFileToVFS(fileName, fileData);
      self.addFont(fileName, fontName, fontStyle);
    });
  };

  jsPdf.jsPDF.API.events.push(['addFonts', callAddFont]);
}
