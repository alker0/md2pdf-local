import {
  default as html2canvas,
  Options as Html2CanvasOptions,
} from 'html2canvas';
import type * as jspdfType from 'jspdf';
import {
  hideSinceMe,
  printMe,
  printMyClone,
  showSinceMe,
} from './md2pdf-style.ts';
import { pdfMaxHeightPt } from './print-value.ts';
import config from '$config';

const { pdfQuality, topArraySelector } = config;

declare global {
  interface Window {
    jspdf: typeof jspdfType;
    html2canvas: typeof html2canvas;
  }
}

window.html2canvas = html2canvas;

const jspdf = window.jspdf;

export interface GetTopElmListOptions {
  minHeight: number;
  maxHeight: number;
}

function getTopElmList(
  target: HTMLElement,
  { minHeight, maxHeight }: GetTopElmListOptions,
): HTMLElement[] {
  const firstElm = target.firstElementChild as HTMLElement;
  if (firstElm == null) {
    console.warn('No child element');
    return [];
  }

  const toppableElmList = Array.from(target.querySelectorAll(
    topArraySelector,
  ));

  if (toppableElmList[0] == null) {
    return [firstElm];
  }

  if (toppableElmList[0] !== firstElm) {
    toppableElmList.unshift(firstElm);
  }

  // console.log(headingElmList);

  const topElmList: HTMLElement[] = [];

  let hasMinHeight = false;
  let currentTopElm: HTMLElement;

  toppableElmList.forEach(
    (toppableArg, index) => {
      const toppableElm = toppableArg as HTMLElement;
      const offsetTop = toppableElm.offsetTop;
      if (index < 1) {
        // currentTopElm = heading;
        currentTopElm = target.firstElementChild as HTMLElement;
        topElmList.push(currentTopElm);
        return;
      }

      const currentHeight = offsetTop - currentTopElm.offsetTop;
      if (!hasMinHeight) {
        if (minHeight <= offsetTop - currentTopElm.offsetTop) {
          hasMinHeight = true;
        } else {
          return;
        }
      }

      if (maxHeight <= currentHeight) {
        // console.log(maxHeight, currentHeight);
        currentTopElm = toppableElm;
        topElmList.push(currentTopElm);
        hasMinHeight = false;
      }
    },
  );

  return topElmList;
}

async function saveMdAsPdfImage(
  target: HTMLElement,
  option: {
    fileNameBody: string;
  },
) {
  const mdWidth = target.clientWidth;
  // A4: 210px*297px(root2)
  const phoneHeight = (mdWidth * 16) / 9;
  const minHeight = phoneHeight * 3;

  // console.log({ mdWidth, minHeight });

  const orientation = 'portrait';
  const canvasOptionCommon: Parameters<typeof html2canvas>[1] = {
    useCORS: true,
    backgroundColor: 'black',
    allowTaint: true,
    logging: false,
    // scale: 1,
    // width: 900,
    // windowWidth: 900,
  };

  // const isTop = 'data-is-top';
  const topIndex = 'data-top-index';

  const topElmList = getTopElmList(target, {
    minHeight,
    maxHeight: Math.floor(pdfMaxHeightPt / window.devicePixelRatio) -
      phoneHeight,
  });

  const topElmMarginList: number[] = [];

  topElmList.forEach(
    (topElm, index) => {
      // topElm.setAttribute(isTop, 'true');
      topElm.setAttribute(topIndex, index.toString());

      topElmMarginList.push(
        Number(
          window.getComputedStyle(topElm, null).marginTop.replaceAll(
            /\D/g,
            '',
          ),
        ),
      );

      return topElm;
    },
  );

  if (topElmList.length < 1) {
    return;
  }

  type OnClone = Required<Html2CanvasOptions>['onclone'];
  type OnCloneParams = Parameters<OnClone>;
  const onclone = (
    pageIndex: number,
    _canvasDoc: OnCloneParams[0],
    canvasMd: OnCloneParams[1],
  ): ReturnType<OnClone> => {
    // console.log('On Clone');
    canvasMd.setAttribute(printMe, 'true');

    const topElm = canvasMd.querySelector(
      `:scope > [${topIndex}="${pageIndex}"]`,
    );

    if (topElm == null) {
      throw new Error('Missing any page top elements');
    }

    topElm.setAttribute(showSinceMe, 'true');
    if (pageIndex < topElmList.length) {
      const nextTopElm = canvasMd.querySelector(
        `:scope > [${topIndex}="${pageIndex + 1}"]`,
      );
      if (nextTopElm != null) {
        nextTopElm.setAttribute(hideSinceMe, 'true');
      }
    }
  };

  const fileNameBody = option.fileNameBody;

  let formatRetio = 1;
  let formatWidth = 0;

  try {
    target.setAttribute(printMyClone, 'true');

    let pdf: jspdfType.jsPDF | null = null;
    // let formatRetio = 1;

    for (
      let pageIndex = 0;
      pageIndex == 0 || pageIndex < topElmList.length;
      pageIndex += 1
    ) {
      // const top = topElm.offsetTop;
      // let height = 0;

      const canvasOption: Parameters<typeof html2canvas>[1] = {
        ...canvasOptionCommon,
        // height,
        onclone: onclone.bind(null, pageIndex),
      };

      canvasOption.y = topElmMarginList[pageIndex];

      try {
        const canvas = await new Promise<HTMLCanvasElement>(
          (resolve, reject) => {
            requestIdleCallback(() => {
              html2canvas(target, canvasOption).then(resolve).catch(reject);
            });
          },
        );

        // return false;

        let formatHeight = 1350;

        if (pdf == null) {
          formatWidth = 1080 * devicePixelRatio;
          formatRetio = formatWidth / canvas.width;
          formatHeight = canvas.height * formatRetio;
          // formatWidth = canvas.width;
          // formatRetio = 1;
          pdf = new jspdf.jsPDF({
            orientation,
            format: [formatWidth, formatHeight],
            unit: 'pt',
            // unit: 'px',
            // hotfixes: ['px_scaling'],
            compress: true,
          });
        } else {
          formatHeight = canvas.height * formatRetio;
          pdf.addPage([formatWidth, formatHeight], orientation);
        }

        const pageSize = pdf.internal.pageSize;

        console.log('Size: %o', {
          page: {
            width: pageSize.getWidth(),
            height: pageSize.getHeight(),
          },
          format: {
            width: formatWidth,
            height: formatHeight,
          },
        });

        pdf.setFillColor('black');
        pdf.rect(0, 0, pageSize.width + 8, pageSize.height + 8, 'F');

        pdf.addImage(
          canvas.toDataURL('image/jpeg', pdfQuality),
          'JPEG',
          0,
          0,
          // canvas.width,
          // canvas.height,
          pageSize.width,
          // pageSize.height,
          formatHeight,
          `${fileNameBody}-${pageIndex}`,
          'SLOW',
          0,
        );

        // return await new Promise((resolve, reject) => {
        //   pdf.html(target, {
        //     callback: () => resolve(false),
        //     html2canvas: canvasOption,
        //     x: 0,
        //     y: 0,
        //     autoPaging: 'text',
        //     fontFaces,
        //     jsPDF: pdf,
        //   });
        // });
      } catch (error) {
        console.error(error);
        break;
      }
    }

    if (pdf == null) {
      return;
    }

    const assertedPdf = pdf as jspdfType.jsPDF;

    // return Promise.resolve();

    const pdfFileName = `${fileNameBody}.pdf`;

    await assertedPdf.save(pdfFileName, { returnPromise: true });
  } catch (error) {
    console.error(error);
  } finally {
    topElmList.forEach((topElm) => {
      topElm.removeAttribute(topIndex);
    });
    target.removeAttribute(printMyClone);
  }
}

export async function saveMdAsPdf(target: HTMLElement, option: {
  fileNameBody: string;
  preserveText?: boolean;
}) {
  if (option.preserveText) {
    throw new Error('Not implemented preserving text data');
  }

  await saveMdAsPdfImage(target, option);
}
