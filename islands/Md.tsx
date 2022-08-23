/** @jsx h */
import { h } from 'preact';
import { Ref, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { tw } from 'twind';
import { css } from 'twind/css';
// @deno-types=../typings/marked.d.ts
import * as marked from 'marked';
import debounce from 'debounce';
import type { JSX } from 'preact';
import { saveMdAsPdf } from '$root/lib/md2pdf.ts';
import { getFontNameList } from '$root/lib/font-utils.ts';
import {
  getMarkdownListStyleForPdf,
  markdownCloneHideRules,
} from '$root/lib/md2pdf-style.ts';
import { getGlobalStyle } from '$root/lib/global-style.ts';
import config from '$config';

const { fixMarkdownInput, md2pdfIgnoreSelector } = config;

const globalStyle = css({
  ':global': getGlobalStyle(),
});

const fontNameList = getFontNameList();
function getFontFamiliesText(): string | undefined {
  if (!Array.isArray(fontNameList) || fontNameList.length < 1) {
    return;
  }

  return fontNameList
    .map((fontName) => `'${fontName}'`)
    .join(', ');
}

const markdownAdditionalStyle = css({
  fontFamily: getFontFamiliesText(),
  ...markdownCloneHideRules,
});

type SetText = (text: string) => void;

function doNothing() {}

function parseMarkdown(markdown: string, setResult: SetText) {
  setResult(marked.parse(markdown));
}

function resizeInput(inputElm: HTMLTextAreaElement) {
  inputElm.style.height = 'auto';
  inputElm.style.height = `${inputElm.scrollHeight}px`;
}

const waitAndParseMarkdown = debounce(parseMarkdown, 360, true);

const invalidFileNameChar = '/\\\\?%*:|"<>';
const additionalInvalidFileNameChar = '!#\\s';

const invalidFileNameCharRegex = new RegExp(
  `[${invalidFileNameChar}${additionalInvalidFileNameChar}]`,
  'g',
);

let isSaving = false;
async function saveMdAsImageWithCheck(
  ev: Event,
  mdElmRef: Ref<HTMLElement>,
  fileNameBody: string,
) {
  if (isSaving) {
    console.warn('Saving markdown');
    return;
  }
  isSaving = true;

  ev.preventDefault();

  try {
    await saveMdAsPdf(mdElmRef.current!, {
      fileNameBody,
    });
  } finally {
    isSaving = false;
  }
}

type EvHandler<T extends HTMLElement, K extends keyof JSX.DOMAttributes<T>> =
  NonNullable<JSX.DOMAttributes<T>[K]>;

export default function Md(
  props: {
    className: string;
    initialContent?: {
      fileNameBody: string;
      md: string;
    };
  },
) {
  const [mdSrc, setMdSrc] = useState<string>();

  // const [resultMarked, setMarked] = useState('Marking...');
  const [resultText, setResultText] = useState('Parsing...');
  const mdElm = useRef<HTMLDivElement>(null);
  const inputMdElm = useRef<HTMLTextAreaElement>(null);

  const initialContent = props.initialContent;
  const noInitialContent = initialContent == null;

  const [fileNameBody, setFileNameBody] = useState(
    initialContent?.fileNameBody ?? 'markdown',
  );

  const [shouldFixMd, setShouldFixMd] = useState(noInitialContent);

  function onSaveButtonClick(ev: Event) {
    saveMdAsImageWithCheck(ev, mdElm, fileNameBody);
  }

  let onMdSrcInput = doNothing as EvHandler<HTMLTextAreaElement, 'onInput'>;
  let onToggleShouldFix = doNothing as EvHandler<HTMLInputElement, 'onChange'>;

  function onFileNameInput(
    ev: JSX.TargetedEvent<HTMLTextAreaElement, Event>,
  ) {
    const inputElm = ev.target as HTMLTextAreaElement;
    const inputValue = inputElm.value;
    const replaced = inputValue.trim().replaceAll(invalidFileNameCharRegex, '')
      .replace(/\.pdf$/, '');
    if (replaced !== inputValue) {
      const { selectionStart, selectionEnd, selectionDirection } = inputElm;

      inputElm.value = replaced;

      inputElm.setSelectionRange(
        selectionStart - 1,
        selectionEnd - 1,
        selectionDirection,
      );

      return;
    }

    const newFileNameBody = replaced;
    if (
      newFileNameBody.length < 1 || newFileNameBody === fileNameBody
    ) {
      return;
    }

    resizeInput(inputElm);

    setFileNameBody(newFileNameBody);
  }

  let effectCallback = doNothing;

  if (noInitialContent) {
    onMdSrcInput = (ev) => {
      const inputElm = ev.target as HTMLTextAreaElement;
      if (ev.isTrusted && /\n{2,}$/.test(inputElm.value)) {
        inputElm.value = `${inputElm.value.trim()}\n`;
        return;
      }

      resizeInput(inputElm);

      const inputValue = inputElm.value;

      setMdSrc(inputValue);
    };

    onToggleShouldFix = (ev) => {
      const checkbox = ev.target as HTMLInputElement;
      setShouldFixMd(checkbox.checked);
    };

    effectCallback = () => {
      const inputElm = inputMdElm.current;
      if (inputElm == null) {
        return;
      }

      resizeInput(inputElm);

      setShouldFixMd(true);

      const firstInputValue = inputElm.value;

      setMdSrc(firstInputValue);

      inputElm.focus();
    };
  } else {
    effectCallback = function effectCallback() {
      const initialMdContent = initialContent.md;
      mdElm.current!.textContent = initialMdContent;
      setMdSrc(initialMdContent);
    };
  }

  const scrollMap: Record<
    string,
    { scrollFnName: 'scrollBy' | 'scrollTo'; getTop: () => number }
  > = {
    PageUp: {
      scrollFnName: 'scrollBy',
      getTop: () => window.innerHeight * -1,
    },
    PageDown: {
      scrollFnName: 'scrollBy',
      getTop: () => window.innerHeight,
    },
    Home: {
      scrollFnName: 'scrollTo',
      getTop: () => 0,
    },
    End: {
      scrollFnName: 'scrollTo',
      getTop: () => document.body.scrollHeight,
    },
  };

  function inputKeydownHandler(ev: KeyboardEvent) {
    if (ev.key === 'Enter') {
      if (ev.shiftKey) {
        saveMdAsImageWithCheck(ev, mdElm, fileNameBody);
      }

      return;
    }

    if (ev.shiftKey || ev.ctrlKey || ev.altKey || ev.metaKey) {
      return;
    }

    if (ev.target === inputMdElm.current) {
      return;
    }

    const scrollFnInfo = scrollMap[ev.key];
    if (scrollFnInfo == null) {
      return;
    }

    window[scrollFnInfo.scrollFnName]({
      top: scrollFnInfo.getTop(),
      behavior: 'smooth',
    });
  }

  const mdSrcMemo = useMemo(() => {
    if (mdSrc == null) {
      return null;
    }

    let targetMdSrc = mdSrc;
    if (shouldFixMd) {
      targetMdSrc = fixMarkdownInput(mdSrc);
    }

    return targetMdSrc;
  }, [mdSrc, shouldFixMd]);

  useEffect(() => {
    if (mdSrcMemo == null) {
      return;
    }

    waitAndParseMarkdown(mdSrcMemo, setResultText);
  }, [mdSrcMemo]);

  function focusBackOnClick(focusBackTarget: HTMLElement) {
    const selection = window.getSelection();
    if (
      selection != null && selection.focusOffset !== selection.anchorOffset &&
      mdElm.current?.contains(selection.anchorNode) &&
      mdElm.current.contains(selection.focusNode)
    ) {
      return;
    }
    requestIdleCallback(() => {
      focusBackTarget.focus();
    });
  }

  function focusBackToInput(ev: FocusEvent) {
    if (ev.relatedTarget != null) {
      return;
    }

    ev.preventDefault();

    const boundFn = focusBackOnClick.bind(null, ev.target as HTMLElement);

    const docBody = document.body;
    docBody.addEventListener(
      'click',
      boundFn,
      { once: true },
    );

    setTimeout(
      docBody.removeEventListener.bind(docBody, 'click', boundFn),
      1000,
    );
  }

  useEffect(() => {
    effectCallback();

    document.querySelectorAll(
      md2pdfIgnoreSelector,
    ).forEach((elm) => {
      const iframe = elm as HTMLIFrameElement;
      iframe.dataset.html2canvasIgnore = 'true';
      iframe.tabIndex = -1;
      iframe.setAttribute('role', 'hidden');
    });

    if (mdElm.current != null) {
      const listStyleDirective = css(
        getMarkdownListStyleForPdf(mdElm.current),
      );
      mdElm.current.classList.add(
        tw(listStyleDirective),
      );
    }
  }, []);

  // useEffect(() => {
  //   initializePdfFont(jspdf);
  // }, []);

  const shouldFixId = 'should-fix';
  const fileNameId = 'file-name';

  const leftSideItemClass = tw
    `bg-black text-pink-300 border(4 solid green-500 focus-within:green-300) rounded-xl not-first-child:mt-1`;
  const inputElmClass = tw`text-green-200 bg-[#48091b] resize-none `;

  const saveButtonClass = tw`block py-0.5 px-2 ${leftSideItemClass}`;

  return (
    <div id='md-container' class={tw`${globalStyle} w-[81%] m-auto relative`}>
      <div id='md-left-side-container' class='fixed h-full -ml-[7.25rem]'>
        <div class='h-full w-[6rem] py-8 flex(& col)'>
          <label
            for={shouldFixId}
            class={`block w-full py-0.5 px-2 cursor-pointer ${leftSideItemClass}`}
          >
            <input
              id={shouldFixId}
              type='checkbox'
              class='mr-1'
              onChange={onToggleShouldFix}
            />
            Fix
          </label>
          <button
            class={saveButtonClass}
            onClick={onSaveButtonClick}
          >
            Save PDF
          </button>
          {
            /* <button class={`${saveButtonClass} mt-1`} onClick={onButtonClick}>
            Save PDF (preserve text)
          </button> */
          }
          <div class='max-w-full'>
            <label for={fileNameId} class='block px-1'>File Name</label>
            <textarea
              id={fileNameId}
              type='text'
              required
              autoFocus={!noInitialContent}
              onInput={onFileNameInput}
              onKeyDown={inputKeydownHandler}
              onfocusout={focusBackToInput}
              class={`w-full px-1 break-all rounded invalid:(border(2 color-red)) ${inputElmClass}`}
              value={fileNameBody}
            />
          </div>
        </div>
      </div>
      <textarea
        id='md-input'
        type='textarea'
        required
        disabled={!noInitialContent}
        autoFocus={noInitialContent}
        onInput={onMdSrcInput}
        onKeyDown={inputKeydownHandler}
        onfocusout={focusBackToInput}
        ref={inputMdElm}
        placeholder='Input here...'
        class={tw`w-full max-h-[20em] p-2 text-2xl ${inputElmClass} ${
          !noInitialContent && 'hidden'
        }`}
      />
      <article
        class={tw(props.className, markdownAdditionalStyle)}
        ref={mdElm}
        dangerouslySetInnerHTML={{ __html: resultText }}
      />
    </div>
  );
}
