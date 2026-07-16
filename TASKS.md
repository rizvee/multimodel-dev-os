# Tasks

> Lightweight public task tracking for maintainers and contributors.

## Current Work

- [x] Prepare v4.0.0 release candidate
- [x] Harden package hygiene and public documentation
- [x] Prepare optional GitHub Packages mirror workflow
- [x] Publish v4.0.0 to npm manually
- [x] Publish the v4.0.0 GitHub release after npm availability was confirmed
- [x] Complete v4.1 Skill OS foundation sprints A-H
- [x] Publish v4.1.0 to npm manually
- [x] Publish the v4.1.0 GitHub release after npm availability was confirmed
- [x] Complete v4.2 Sprint A gateway protocol and architecture contracts
- [x] Complete v4.2 Sprint B runtime provider/model registry snapshots
- [x] Complete v4.2 Sprint C deterministic routing without provider calls
- [x] Complete v4.2 Sprint D fallback, retry, timeout, and resilience simulation contracts
- [x] Complete v4.2 Sprint E localhost-only mock gateway runtime
- [ ] Maintain `main` as the v4.2 development lane without publishing dev versions

## Backlog

- [ ] Prepare v4.2 Sprint F client and agent configuration against the local mock gateway
- [ ] Collect post-release feedback and triage v4.1.x candidates
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
