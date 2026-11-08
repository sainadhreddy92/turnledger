import { decodeLine } from "./archive.ts";
import type { Draft } from "./model.ts";

/** Decode complete records as bytes arrive from a file or HTTP response. */
export async function* readArchive(
  chunks: AsyncIterable<Uint8Array>,
): AsyncGenerator<Draft> {
  const decoder = new TextDecoder();
  let remainder = "";
  let line = 0;
  for await (const chunk of chunks) {
    remainder += decoder.decode(chunk);
    let newline = remainder.indexOf("\n");
    while (newline !== -1) {
      const source = remainder.slice(0, newline);
      remainder = remainder.slice(newline + 1);
      const draft = decodeLine(source, ++line);
      if (draft) yield draft;
      newline = remainder.indexOf("\n");
    }
  }
  if (remainder.length > 0) {
    const draft = decodeLine(remainder, ++line);
    if (draft) yield draft;
  }
}
