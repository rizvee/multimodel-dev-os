# Tasks

> Lightweight public task tracking for maintainers and contributors.

## Current Work

- [x] Prepare v4.0.0 release candidate
- [x] Harden package hygiene and public documentation
- [x] Prepare optional GitHub Packages mirror workflow
- [ ] Publish v4.0.0 to npm manually
- [ ] Publish the GitHub draft release after npm availability is confirmed

## Backlog

- [ ] Collect post-release feedback and triage v4.1.0 candidates
- [ ] Continue improving adapter documentation and template coverage
- [ ] Review GitHub Packages adoption after npmjs release

## Done

- [x] Modularized CLI routing, registry handlers, and inspection handlers
- [x] Decomposed the verification engine into focused modules
- [x] Added registry trust add/remove coverage and remote key fetch support
- [x] Added GPG-compatible signature verification in the policy engine
- [x] Deployed offline signed-registry fixtures and regression tests
- [x] Implemented structured trust verdict reporting
- [x] Added Ed25519 public-key registry signatures and trust-store validation
- [x] Added registry provenance lockfile support
- [x] Expanded handler-level unit coverage
- [x] Published public security, registry, package, and release documentation
