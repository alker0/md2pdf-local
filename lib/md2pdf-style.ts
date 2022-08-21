import { CSSRules } from 'twind';
import { createCounterText } from 'html2canvas/dist/lib/css/types/functions/counter';
import { listStyleType as listStyleTypeParser } from 'html2canvas/dist/lib/css/property-descriptors/list-style-type';

export const printMe = 'data-print-me';
export const printMyClone = 'data-print-my-clone';
export const showSinceMe = 'data-show-since-me';
export const hideSinceMe = 'data-hide-since-me';

function getOrderListStyleBefore(listStyleTypeArg?: string) {
  const marginLeft = '-2.5rem';

  const result = {} as CSSRules;

  const listStyleType = listStyleTypeArg ?? 'decimal';
  const listStyleTypeEnumValue = listStyleTypeParser.parse(null, listStyleType);

  for (let i = 1; i < 100; i += 1) {
    const counterText = createCounterText(i, listStyleTypeEnumValue, true);

    result[`&:nth-child(${i})::before`] = {
      content: `'${counterText}'`,
      marginLeft,
    };
  }

  return result;
}

// const mdHideTargetMark = `[${printMe}]`;
const mdHideTargetMark = `[${printMyClone}]`;

export const markdownCloneHideRules: CSSRules = {
  [`&[${printMe}]`]: {
    [`& > *:not([${showSinceMe}], [${showSinceMe}] ~ *)`]: {
      display: 'none',
    },
    [`& > [${hideSinceMe}], & > [${hideSinceMe}] ~ *`]: {
      display: 'none',
    },
  },
};

type MarkdownAdditionalStyleForPdfMemo = {
  rules: CSSRules;
  target: Element;
} | null;
let markdownAdditionalStyleForPdfMemo: MarkdownAdditionalStyleForPdfMemo = null;

export function getMarkdownListStyleForPdf(
  target: Element,
): CSSRules {
  if (target === markdownAdditionalStyleForPdfMemo?.target) {
    return markdownAdditionalStyleForPdfMemo.rules;
  }

  const olElm = document.createElement('ol');
  target.prepend(olElm);

  const listStyleType = window.getComputedStyle(olElm, null).listStyleType;

  const resultRules = {
    [`&${mdHideTargetMark}`]: {
      [`& ul`]: {
        listStyleType: 'none',
        [`& > li::before`]: {
          content: '\'• \'',
          marginLeft: '-2.2rem',
          paddingLeft: '0.5rem',
        },
      },
      [`& ol`]: {
        listStyleType: 'none',
        [`& > li`]: {
          ...getOrderListStyleBefore(listStyleType),
        },
      },
    },
  };

  markdownAdditionalStyleForPdfMemo = {
    rules: resultRules,
    target,
  };

  olElm.remove();

  return resultRules;
}
