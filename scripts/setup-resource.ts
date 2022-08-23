import { download } from 'download';
import * as path from 'path';
import { CssFontFaceInfo, CssFontFeceSrcItem } from '$root/lib/font-utils.ts';
import config from '$config';

const { cssFontList } = config;

function getCssFontResourceList() {
  return cssFontList.filter((cssFontInfo) => Boolean(cssFontInfo.needFontFace))
    .flatMap((cssFontInfo) => {
      const { fontFamily, src: srcList } = cssFontInfo as CssFontFaceInfo;
      return srcList.filter((src) =>
        typeof src.downloadUrl === 'string' &&
        src.url.startsWith('/fonts/')
      ).map(
        (src) => {
          const { url: installPathRaw, downloadUrl } = src as Required<
            CssFontFeceSrcItem
          >;

          return {
            fontFamily,
            installPathUrl: new URL(
              `../static/${installPathRaw.replace(/^\//, '')}`,
              import.meta.url,
            ),
            downloadUrl,
          };
        },
      );
    });
}

let alreadySetupStarted = false;

export async function setupResource() {
  if (alreadySetupStarted) {
    // console.log('Skip downloading fonts');
    return;
  }

  alreadySetupStarted = true;

  const cssFontResourceList = getCssFontResourceList();

  const downloadingFontList = cssFontResourceList.map(
    async ({ fontFamily, installPathUrl, downloadUrl }) => {
      try {
        await Deno.stat(installPathUrl);
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          const installPath = path.fromFileUrl(installPathUrl);

          console.log(
            `Download '${fontFamily}' to '${installPath}' from '${downloadUrl}'`,
          );

          await download(downloadUrl!, {
            file: path.basename(installPath),
            dir: path.dirname(installPath),
          });
        } else {
          throw error;
        }
      }
    },
  );

  await Promise.all(downloadingFontList);
}
