/**
 * Minor utilities, separated here for an easier maintenance and cleaner code.
 * 
 *
 * 
 * @packageDocumentation
 */

import { Graph, Constants, TestEntry, TestResult, TestTypes, Json, IDMapping } from './types.ts';
import { RDFC10, BNodeId }                                                  from 'npm:rdfjs-c14n@^2.0.5';
// // @deno-types="../../../rdfjs-c14n/dist/index.d.ts"
// import { RDFC10, BNodeId }                                                     from '../../../rdfjs-c14n/dist/index.d.ts';
import * as rdfn3                                                              from './rdfn3.ts';
import * as rdf                                                                from 'npm:rdf-js';


/**
 * As its name says: fetch a JSON file and convert it into a real JSON structure
 * @param fname 
 * @returns 
 */
export async function fetchJson(fname: string): Promise<Json> {
    const f = await fetch(fname);
    return f.json();
}


/**
 * As its name says: fetch a text file 
 * @param fname 
 * @returns 
 */
async function fetchText(fname: string): Promise<string> {
    const nqp = await fetch(fname);
    return nqp.text();           
};


/**
 * 
 * @param produced 
 * @returns 
 */
const convertIdMap = (produced: ReadonlyMap<BNodeId,BNodeId>): IDMapping => {
    const retval: IDMapping = {};

    for (const [key,value] of produced) {
        retval[key] = value
    }
    return retval;
}


/**
 * Get the list of all tests, which is an array in the manifest file. The manifest 
 * itself is fetched from the github repository. The necessary URL fragments are separated in 
 * the `./types` module.
 * 
 * 
 * @param manifest_name 
 * @returns 
 */
export async function getTestList(manifest_name: string): Promise<TestEntry[]> {
    const manifest: Json = await fetchJson(`${Constants.TEST_DIR}${manifest_name}`);
    return manifest["entries"] as TestEntry[];
}


/**
 * Handle a single timeout test: the test is parsed and the input is canonicalized.
 * However, the canonicalization step is expected to run into a timeout exception; the
 * result is true only if that happens.
 * 
 * @param test 
 * @param canonicalizer 
 * @returns 
 */
async function timeoutTest(test: TestEntry, canonicalizer: RDFC10): Promise<TestResult> {
    const quads = await fetchText(`${Constants.TEST_DIR}${test.action}`);

    const input_graph: Graph = rdfn3.getQuads(quads);

    try {
        canonicalizer.c14n(input_graph);
    } catch (e) {
        if (e instanceof RangeError) {
            // That was the expected result!
            return {
                id               : test.id,
                type             : test.type,
                input_nquads     : rdfn3.graphToOrderedNquads(input_graph),
                c14n_nquads      : [],
                c14n_mapping     : {},
                expected_nquads  : [],
                expected_mapping : {},
                pass             : true
            }
        } else {
            // Something else happened...
            throw(e);
        }
    }

    // It should not have gotten that far...
    return {
        id               : test.id,
        type             : test.type,
        input_nquads     : rdfn3.graphToOrderedNquads(input_graph),
        c14n_nquads      : [],
        c14n_mapping     : {},
        expected_nquads  : [],
        expected_mapping : {},
        pass             : false
    }
}


/**
 * Handle a single mapping test: the test is parsed,
 * the input is canonicalized, and the canonical mapping is extracted to be compared
 * with the expected mapping. The input is also re-serialized as a sorted quads, to 
 * be displayed as part of the test results.
 * 
 * (It might have been possible to compare the quads by comparing their hash values...)
 * 
 * @param test 
 * @param canonicalizer 
 * @returns 
 */
async function mapTest(test: TestEntry, canonicalizer: RDFC10): Promise<TestResult> {
    interface TestPair {
        quads   : string,
        expected_mapping : IDMapping
    }

    const getTestPair = async (test: TestEntry): Promise<TestPair> => {
        const [p_quads, p_mapping] = await Promise.allSettled([
            fetchText(`${Constants.TEST_DIR}${test.action}`),
            fetchJson(`${Constants.TEST_DIR}${test.result}`)
        ]);

        const errors: string[] = [];

        if (p_quads.status === "rejected") {
            errors.push(`Mapping test on test ${test.id}: n-quad graph could not be read (${p_quads.reason})`)
        } else if (p_mapping.status === "rejected") {
            errors.push(`Mapping test on test ${test.id}: expected bnode mapping could not be read (${p_mapping.reason})`)
        }

        if (errors.length > 0) {
            throw new Error(errors.join("; "))
        } else {
            // Strictly speaking the test for status is unnecessary, but
            // tsc (or lint) complains...
            return {
                quads            : p_quads.status   === "fulfilled" ? p_quads.value : '', 
                expected_mapping : p_mapping.status === "fulfilled" ? p_mapping.value as IDMapping : {}
            }
        }
    }

    const compareMaps = (expected: IDMapping, produced: ReadonlyMap<BNodeId,BNodeId>): boolean => {
        for (const orig_id in expected) {
            if (expected[orig_id] !== produced.get(orig_id)) {
                return false;
            }
        }
        return true;
    }

    const compareKeys = (graph: Graph, produced: ReadonlyMap<BNodeId,BNodeId>): boolean => {
        const getBNodeIds = (graph: Graph): Set<BNodeId> => {
            const bnode_ids: Set<BNodeId> = new Set();
            const addBnode = (term: rdf.Term): void => {
                if (term.termType === "BlankNode") {
                    bnode_ids.add(term.value)
                }
            }
    
            graph.forEach((quad: rdf.Quad): void => {
                addBnode(quad.subject);
                addBnode(quad.object);
                addBnode(quad.graph);
            });
            return bnode_ids
        }

        const expected: Set<BNodeId> = getBNodeIds(graph);
        if (expected.size !== produced.size) {
            return false;
        } else {
            for (const key of expected) {
                if (!produced.has(key)) {
                    return false;
                }
            }
            return true;
        }
    }

    // Get the test and the expected result from the test entry;
    const { quads, expected_mapping} = await getTestPair(test);

    const input_graph: Graph = rdfn3.getQuads(quads);
    const c14n_result        = canonicalizer.c14n(input_graph);
    const c14n_mapping       = c14n_result.issued_identifier_map;

    const pass: boolean = compareMaps(expected_mapping, c14n_mapping) && compareKeys(input_graph, c14n_mapping);

    return {
        id               : test.id,
        type             : test.type,
        input_nquads     : rdfn3.graphToOrderedNquads(input_graph),
        c14n_nquads      : [],
        c14n_mapping     : convertIdMap(c14n_mapping),
        expected_nquads  : [],
        expected_mapping,
        pass,
    }
}

/**
 * Handle a single eval test: the test, and its requested canonical equivalents are parsed,
 * the input is canonicalized, and the three datasets (input, canonical, and requested) are
 * serialized back into nquads, with the latter two compared. Comparison is made by 
 * comparing the arrays of nquads in order as strings.
 * 
 * (It might have been possible to compare the quads by comparing their hash values...)
 * 
 * @param test 
 * @param canonicalizer 
 * @returns 
 */
async function evalTest(test: TestEntry, canonicalizer: RDFC10): Promise<TestResult> {
    interface TestPair {
        input    : string,
        expected : string,
    }

    //
    // Get the nquad representation of a single test, and of its requested canonical pair,
    // fetched from the github repository. The necessary URL fragments are separated in 
    // the `./types` module.
    //
    //
    const getTestPair = async (test: TestEntry): Promise<TestPair> => {    
        const [p_input, p_expected] = await Promise.allSettled([
            fetchText(`${Constants.TEST_DIR}${test.action}`),
            fetchText(`${Constants.TEST_DIR}${test.result}`)
        ]);

        const errors: string[] = [];

        if (p_input.status === "rejected") {
            errors.push(`Eval test on test ${test.id}: n-quad graph could not be read (${p_input.reason})`)
        } else if (p_expected.status === "rejected") {
            errors.push(`Eval test on test ${test.id}: expected n-quad graph data could not read (${p_expected.reason})`)
        }

        if (errors.length > 0) {
            throw( errors.join("; "));
        } else {
            // Strictly speaking the test for status is unnecessary, but
            // tsc (or lint) complains...
            return {
                input    : p_input.status    === "fulfilled" ? p_input.value    : '', 
                expected : p_expected.status === "fulfilled" ? p_expected.value : ''
            }
        }
    };

    // Compare two arrays of nquads line by line and in order...
    const compareNquads = (left: string[], right: string[]): boolean => {
        if (left.length !== right.length) {
            return false;
        } else {
            for (let index = 0; index < left.length; index++) {
                if (left[index] !== right[index]) {
                    return false;
                }
            }
            return true;
        }    
    };

    // Get the test and the expected result from the test entry;
    // the returned values are strings of nquads.
    const { input, expected } = await getTestPair(test);

    // Get the three graphs in 'real' graph including the canonicalized one.
    const input_graph: Graph    = rdfn3.getQuads(input);
    const expected_graph: Graph = rdfn3.getQuads(expected);
    const c14n_result           = canonicalizer.c14n(input_graph);
    const c14n_graph: Graph     = c14n_result.canonicalized_dataset as Graph;

    // Serialize the three graphs/datasets. The last two will be compared; if they match, the test passes.
    const input_nquads: string[]    = rdfn3.graphToOrderedNquads(input_graph);
    const expected_nquads: string[] = rdfn3.graphToOrderedNquads(expected_graph);
    const c14n_nquads: string[]     = rdfn3.graphToOrderedNquads(c14n_graph);

    return {
        id               : test.id,
        type             : test.type,
        input_nquads, 
        c14n_nquads,
        c14n_mapping     : convertIdMap(c14n_result.issued_identifier_map),
        expected_nquads,
        expected_mapping : {},
        pass             : compareNquads(c14n_nquads, expected_nquads)
    };
}

/**
 * Handle a single test: the test, and its requested canonical equivalents are parsed,
 * the input is canonicalized, and the three datasets (input, canonical, and requested) are
 * serialized back into nquads, with the latter two compared. Comparison is made by 
 * comparing the arrays of nquads in order as strings.
 * 
 * (It might have been possible to compare the quads by comparing their hash values...)
 * 
 * @param test 
 * @param canonicalizer 
 * @returns 
 */
export async function singleTest(test: TestEntry, canonicalizer: RDFC10): Promise<TestResult> {
    // A bit of a hack... if the test requires to change the default hash algorithm,
    // then the "common" canonicalizer won't be usable, because it may interfere with other
    // tests that run in under promises. 
    // Better create a new instance of the canonicalizer. It is less efficient, but there are only
    // few tests that include this feature, so it does not really matter.
    const finalCanonicalizer = () :RDFC10 => {
        if (test.hashAlgorithm !== undefined && test.hashAlgorithm !== "sha256") {
            const rdfc10 = new RDFC10();
            // First check whether the provided hash algorithm is usable or not
            if (rdfc10.available_hash_algorithms.includes(test.hashAlgorithm.toLowerCase())) {
                rdfc10.hash_algorithm = test.hashAlgorithm;
            } else {
                throw new Error(`${test.hashAlgorithm} is not available for rdfjs-c14n; test cannot be run`);
            }
            return rdfc10;
        } else {
            return canonicalizer;
        }
    }
    const final_canonicalizer = finalCanonicalizer();

    try {
        switch (test.type) {
            case TestTypes.eval: 
                return evalTest(test, final_canonicalizer);
            case TestTypes.timeout:
                return timeoutTest(test, final_canonicalizer);
            case TestTypes.map:
                return mapTest(test, final_canonicalizer);
            default:
                throw new Error(`Unknown test type: ${test.type}`);
        }
    } catch(error) {
        throw (`${test.id}: ${error}`)
    }
}