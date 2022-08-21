/** @jsx h */
import { h } from 'preact';
import { Handlers, PageProps } from '$fresh/server.ts';
import Md from '$root/islands/Md.tsx';
import { JsPdfCdn } from '$root/components/CdnScripts.tsx';
import BasicHead from '$root/components/BasicHead.tsx';
import { setupResource } from '$root/scripts/setup-resource.ts';
import { getMarkdownClassName } from '$root/scripts/markdown-class.ts';

interface PageData {
  mdClassName: string;
}

let mdClassName: string | null = null;

export const handler: Handlers<PageData> = {
  async GET(_, ctx) {
    await setupResource();

    if (typeof mdClassName !== 'string') {
      mdClassName = await getMarkdownClassName();
    }

    return ctx.render({ mdClassName });
  },
};

export default function ConvertMdFromInput({ data }: PageProps<PageData>) {
  return (
    <div class='p-2 relative'>
      <BasicHead />
      <Md className={data.mdClassName} />
      <JsPdfCdn />
    </div>
  );
}
