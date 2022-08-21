import { readLines } from 'io';

export async function setupCustomize() {
  const configUrl = new URL(`../md2pdf.config.ts`, import.meta.url);

  try {
    await Deno.stat(configUrl);

    if (import.meta.main) {
      console.log('`md2pdf.config.ts` exists already.');
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      const defaultConfigUrl = new URL(
        `../lib/customize-default.ts`,
        import.meta.url,
      );

      console.log(
        `Copy '${defaultConfigUrl.pathname}' to '${configUrl.pathname}'`,
      );

      const file = await Deno.open(defaultConfigUrl, { read: true });

      const copyStartRegex = /\s*\/\/\s*_\s+copy\s+start(?:\s+with\s+(.*))?/i;
      const copyEndRegex = /\s*\/\/\s*_\s+copy\s+end(?:\s+with\s+(.*))?/i;
      const replaceRegex =
        /\s*\/\/\s*_\s+replace\s+with\s+\/([^/]+)\/([^/]*)\//i;

      try {
        const resultLineList: string[] = [];
        let shouldCopy = true;
        let requestReplace = null as [RegExp, string] | null;
        for await (const line of readLines(file)) {
          if (shouldCopy) {
            if (requestReplace != null) {
              resultLineList.push(line.replace(...requestReplace));
              requestReplace = null;
              continue;
            }

            const copyEndMatches = line.match(
              copyEndRegex,
            );
            if (Array.isArray(copyEndMatches)) {
              shouldCopy = false;
              const afterWith = copyEndMatches[1];
              if (typeof afterWith === 'string') {
                resultLineList.push(afterWith);
              }
            } else {
              const replaceMatches = line.match(replaceRegex);
              if (Array.isArray(replaceMatches)) {
                const [, replaceTargetRegexSource, replaced] = replaceMatches;
                requestReplace = [
                  new RegExp(replaceTargetRegexSource),
                  replaced,
                ];
              } else {
                resultLineList.push(line);
              }
            }
          } else {
            const copyStartMatches = line.match(
              copyStartRegex,
            );
            if (Array.isArray(copyStartMatches)) {
              shouldCopy = true;
              const afterWith = copyStartMatches[1];
              if (typeof afterWith === 'string') {
                resultLineList.push(afterWith);
              }
            }
          }

          resultLineList[0] = resultLineList[0].replace(/^\s*\/\/\s*/, '');

          await Deno.writeTextFile(configUrl, resultLineList.join('\n'));
        }
      } finally {
        file.close();
      }
    } else {
      throw error;
    }
  }
}

if (import.meta.main) {
  await setupCustomize();
}
