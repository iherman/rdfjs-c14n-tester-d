# Testing [rdfjs-c14n](https://github.com/iherman/rdfjs-c14n) using [Deno](https://deno.land)

[rdfjs-c14n](https://github.com/iherman/rdfjs-c14n) is an implementation (under development) of the [RDF Dataset Canonicalization](https://www.w3.org/TR/rdf-canon/) algorithm. (The algorithm is being specified by the W3C [RDF Dataset Canonicalization and Hash Working Group](https://www.w3.org/groups/wg/rch)). This repository is to become an "official" test for the algorithm, eventually relying on the testing methodology the WG will adopt in due time. The test material (test manifest and the tests themselves) are directly fetched from the [official repository](https://github.com/w3c/rdf-canon/) of the specification.

Having this as a separate repository makes it also possible to test `rdfjs-c14n` as a separate module to be used, via `npm`, as an imported module in other places. 

Functionally, but also in terms of the Typescript code, this version is almost identical to its [sister project](https://github.com/iherman/rdfjs-c14n-tester), except that this version runs on top of [Deno](https://deno.land) instead of [Node.js](https://nodejs.org). One of the reasons to create this version was to make it sure that `rdfjs-c14n` has no dependency on the node.js runtime. (This package makes use of Deno's facility to load npm packages directly from the npm repository.)

---
Maintainer: [@iherman](https://github.com/iherman)
