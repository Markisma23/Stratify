import { copyFile, mkdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";

const ROOT = process.env.ARTIFACT_STORE_PATH ?? "/tmp/stratify-artifacts";

export const persistImmutableArtifact = async (sourcePath: string) => {
  await mkdir(ROOT, { recursive: true });
  const target = join(ROOT, `${Date.now()}-${basename(sourcePath)}`);

  try {
    await stat(target);
    throw new Error("Target path already exists; immutable write violated");
  } catch {
    // path does not exist
  }

  await copyFile(sourcePath, target);
  return target;
};
