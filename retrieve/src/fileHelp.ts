import { readFile, stat, writeFile } from "fs/promises";

export async function fileExists(path: string) {
  return !!(await stat(path).catch((e) => false));
}

export async function readFileJSON<T>(file: string): Promise<T | undefined> {
  if (!(await stat(file))) {
    console.error(`${file} does not exist`);
    return undefined;
  }
  const json = await readFile(file, "utf-8");
  const data = JSON.parse(json);
  if (data == undefined) {
    throw new Error(`Error loading in data from ${file}`);
  }

  return data;
}

export async function writeFileJSON(file: string, data: any) {
  await writeFile(file, JSON.stringify(data, null, "\t"));
}
