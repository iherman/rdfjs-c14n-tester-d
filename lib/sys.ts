/**
 * Deno/node common interface.
 * 
 * @packageDocumentation
 */

// Node.js
// import { promises as fs } from 'node:fs';

/**
 * 
 * @returns list of arguments the way the commander package expects it
 */
export function args() : string[] {
    // Node.js
    // return process.argv;
    // Deno
    return [Deno.execPath(), Deno.execPath(), ...Deno.args];
}

/**
 * Title tells it all...
 * @param fname file name
 * @returns 
 */
export async function readTextFile(fname: string): Promise<string> {
    // Node.js
    // return fs.readFile(fname, "utf-8");
    // Deno
   return Deno.readTextFile(fname);
}

/**
 * Title tells it all...
 * @param fname file name
 * @param data 
 * @returns 
 */
export async function writeTextFile(fname: string, data: string): Promise<void> {
    // Node.js
    // return fs.writeFile(fname, data);
    // Deno
   return Deno.writeTextFile(fname, data)
}
