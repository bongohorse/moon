# Dependency dashboard maintenance

This batch implements the nine update groups listed in Dependency Dashboard #7 on 13 October 2026. Engine/gameplay dependencies remain Defold 1.14.0 and integrated Box2D 3.1.0.

| Dependency | Updated pin |
| --- | --- |
| actions/checkout | v7.0.1 |
| actions/setup-node | v7.1.0 |
| actions/setup-java | v6.0.1 |
| actions/upload-artifact | v7.0.2 |
| actions/upload-pages-artifact | v5.0.0 |
| actions/deploy-pages | v5.0.1 |
| GitHub-hosted Ubuntu runner | ubuntu-26.04 |
| Temurin Java | 25.0.4+101.0.LTS |
| Renovate | 44.155.5 |

All directly used actions retain full commit-SHA pins resolved from their official release tags. The workflow permissions and check names are preserved. The Node 24-based action runtimes use GitHub-hosted runners; no self-hosted runner compatibility is claimed.

Java's full semver pin was checked in the Adoptium Linux x64 JDK asset catalog used by setup-java. Adoptium's API represents the hotfix as 25.0.4+101.0.LTS; this is not a manually invented version. Archive checksum verification is provided by setup-java, and Temurin package signature verification is explicitly enforced for downloads.

Ubuntu 26.04 is listed as a supported image in actions/runner-images. Build and browser CI must pass on this image before merging. The Pages actions are reviewed together; production deployment from main and the live /moon/ path are verified after merging because Pages runs only on main.

Renovate's minor package update includes its npm lockfile integrity metadata. Local Lua assertions, Renovate schema validation and the native Defold extractor are checked before CI. The complete HTML5/Android/browser workflow gates this manually reviewed batch. Renovate automerge remains disabled, including major updates; future dashboard approvals remain separate.

Official sources: each actions repository release and action.yml, actions/runner-images/README.md, api.adoptium.net/v3/assets/version (Linux x64 Temurin JDK), and registry.npmjs.org/renovate.
