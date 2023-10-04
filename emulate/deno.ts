/**
 * 
 * @returns list of arguments the way the commander package expects it
 */
export function args() : string[] {
    return [Deno.execPath(), Deno.execPath(), ...Deno.args];
}

/**
 * Title tells it all...
 * @param fname file name
 * @returns 
 */
export async function readTextFile(fname: string): Promise<string> {
    return Deno.readTextFile(fname);
}

/**
 * Title tells it all...
 * @param fname file name
 * @param data 
 * @returns 
 */
export async function writeTextFile(fname: string, data: string): Promise<void> {
    return Deno.writeTextFile(fname, data)
}
