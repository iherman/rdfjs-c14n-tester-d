/**
 * Direct interface to the N3 Package for the nquad parser, and on rdf-string for the nquad serializer.
 * All other parts of the library should only depend on the general
 * rdf-js package, ie, the using the semi-official data model specification only.
 * 
 * @packageDocumentation
 */

import { Graph } from './types';

import * as n3    from 'n3';
import * as rdf   from 'rdf-js';
import { nquads } from '@tpluscode/rdf-string';

/**
 * Convert the graph into ordered NQuads, more exactly into an array of individual NQuad statements.
 * 
 * @param quads 
 * @returns 
 */
export function graphToOrderedNquads(quads: Graph): string[] {
    const quadToNquad = (quad: rdf.Quad): string => {
        const retval = nquads`${quad}`.toString();
        return retval.endsWith('  .') ? retval.replace(/  .$/, ' .') : retval;    
    }

    const retval: string[] = [];
    for (const quad of quads) {
        retval.push(quadToNquad(quad))
    }
    return retval.sort();
}

/**
 * Parse a turtle/trig file and return the result in a set of RDF Quads. 
 * Input format is a permissive superset of Turtle, TriG, N-Triples, and N-Quads.
 * An extra option is used during parsing to re-use the blank node id-s in the input without modification. 
 * 
 * @param trig - TriG content
 * @returns 
 */
export function getQuads(trig: string): Graph {    
    const parser = new n3.Parser({blankNodePrefix: ''});
    const quads: rdf.Quad[] = parser.parse(trig);
    return new Set<rdf.Quad>(quads);
}



