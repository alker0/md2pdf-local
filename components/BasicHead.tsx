/** @jsx h */
import { Head } from '$fresh/runtime.ts';
import { h } from 'preact';
import config from '$config';

const { pageTitle } = config;

export default function BasicHead(props: {
  fileNameBody?: string;
}) {
  const fileNameBody = props.fileNameBody;
  let title = pageTitle.default;
  if (typeof fileNameBody === 'string') {
    title = `${pageTitle.prefix}${fileNameBody}`;
  }

  return (
    <Head>
      <meta charSet='UTF-8' />
      <title>{title}</title>
      <meta name='robots' content='noindex,nofollow' />
      <link rel='stylesheet' href='/markdown.css' />
    </Head>
  );
}
