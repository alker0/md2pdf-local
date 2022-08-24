/** @jsx h */
import { h } from 'preact';
import { Handlers, PageProps } from '$fresh/server.ts';
import BasicHead from '$root/components/BasicHead.tsx';
import { JsPdfCdn } from '$root/components/CdnScripts.tsx';
import Md from '$root/islands/Md.tsx';
import { setupResource } from '$root/scripts/setup-resource.ts';
import { getMarkdownClassName } from '$root/scripts/markdown-class.ts';

interface PageData {
  mdFileBaseName: string;
  mdContent: string;
  mdClassName: string;
}

let mdClassName: string | null = null;

export const handler: Handlers<PageData> = {
  async GET(_, ctx) {
    await setupResource();

    if (typeof mdClassName !== 'string') {
      mdClassName = await getMarkdownClassName();
    }

    const mdFileBaseName = ctx.params.name;
    const mdFileUrl = new URL(
      `../static/md/${mdFileBaseName}`,
      import.meta.url,
    );

    try {
      const mdContent = Deno.readTextFileSync(mdFileUrl);

      return ctx.render({ mdFileBaseName, mdContent, mdClassName });
    } catch (error: unknown) {
      if ((error as Error).name !== 'NotFound') {
        console.error(error);
      }
      return ctx.renderNotFound();
    }
  },
};

export default function ConvertMdFromFile(
  { data }: PageProps<PageData>,
) {
  const { mdFileBaseName, mdContent } = data;

  return (
    <div class='p-2 relative'>
      <BasicHead fileNameBody={mdFileBaseName} />
      <Md
        className={data.mdClassName}
        initialContent={{
          fileNameBody: mdFileBaseName.replace(/\.md$/, ''),
          md: mdContent,
        }}
      />
      <JsPdfCdn />
    </div>
  );
}
