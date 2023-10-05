import { promises as fs }              from 'node:fs';

/**
 * 
 * @returns list of arguments the way the commander package expects it
 */
export function args(): string[] {
    return process.argv;
}

/**
 * Title tells it all...
 * @param fname file name
 * @returns 
 */
export async function readTextFile(fname: string): Promise<string> {
    return fs.readFile(fname, "utf-8");
}

/**
 * Title tells it all...
 * @param fname file name
 * @param data 
 * @returns 
 */
export async function writeTextFile(fname: string, data: string): Promise<void> {
    return fs.writeFile(fname, data);
}
