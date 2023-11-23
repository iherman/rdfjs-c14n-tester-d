# Testing [rdfjs-c14n](https://github.com/iherman/rdfjs-c14n) using [Deno](https://deno.land)

[rdfjs-c14n](https://github.com/iherman/rdfjs-c14n) is an implementation of the [RDF Dataset Canonicalization](https://www.w3.org/TR/rdf-canon/) algorithm. (The algorithm has been defined by the W3C [RDF Dataset Canonicalization and Hash Working Group](https://www.w3.org/groups/wg/rch)). This repository is an test-runner for the algorithm, relying on the testing methodology the WG has adopted. The test material (test manifest and the tests themselves) are directly fetched from the [official test repository](https://github.com/w3c/rdf-canon/) of the specification, and the test-runner generates the relevant reports in EARL format. Having this as a separate repository makes it also possible to test `rdfjs-c14n` as a separate module to be used, e.g., via `npm` from a separate Typescript program.

Functionally, but also in terms of the Typescript code, there is also a ["sister" project](https://github.com/iherman/rdfjs-c14n-tester) doing essentially the same, except that while that version runs on top of [node.js](https://nodejs.org), this does it on top of [Deno](https://deno.land). The differences in the code are insignificant (mostly a different way of referencing to imported modules), but it also proves that the core, `rdfjs-c14n` npm package can also be used from Deno.

(Historically, the version relying on node.js was the first. This deno version is the result of my own curiosity, to see whether deno offers the same development possibility as the node.js+tsc combination does or not. The answer is mostly yes, due to the fact that it is now possible to import most of the npm packages into deno.)


---
Maintainer: [@iherman](https://github.com/iherman)
