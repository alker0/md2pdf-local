/** @jsx h */
import { h } from 'preact';
import { UnknownPageProps } from '$fresh/server.ts';
import { tw } from 'twind';
import { css } from 'twind/css';

export default function NotFoundPage({ url }: UnknownPageProps) {
  const globalStyle = css({
    ':global': {
      body: {
        backgroundColor: 'moccasin',
      },
    },
  });

  return (
    <div
      class={tw
        `w-[81%] h-[80vh] mx-auto my-[10vh] relative bg-black text-center flex(& col) justify-center ${globalStyle}`}
    >
      <h1 class='text(4xl red-400) font-bold border(b-4 solid red-400) mx-auto'>
        404 Not Found at `{url.pathname}`
      </h1>
    </div>
  );
}
