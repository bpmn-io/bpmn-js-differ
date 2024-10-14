# Changelog

All notable changes to [bpmn-js-differ](https://github.com/bpmn-io/bpmn-js-differ) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

## 3.0.2

* `FIX`: restore `main` entry point ([#27](https://github.com/bpmn-io/bpmn-js-differ/pull/27))

## 3.0.1

* `FIX`: detect type change ([#24](https://github.com/bpmn-io/bpmn-js-differ/issues/24))

## 3.0.0

* `FEAT`: diff based on [moddle](https://github.com/bpmn-io/moddle) infrastructure
* `FEAT`: detect flow source and target changes ([#18](https://github.com/bpmn-io/bpmn-js-differ/issues/18))
* `CHORE`: turn into ES module
* `CHORE`: drop UMD distribution
* `DEPS`: update to `diffpatch@0.6.0`

### Breaking Changes

* Drop UMD distribution; consume as an ES module.

## 2.0.2

* `FIX`: swap new/old value in collection properties

## 2.0.0

* `FEAT`: track `bpmn:Collaboration` changes
* `FEAT`: track `bpmn:Process` changes
* `FEAT`: detect collection addition
* `FEAT`: mark parent as changed on nested, un-tracked changes
* `FEAT`: track collection property changes with path(s)

## 1.2.0

* `FEAT`: migrate from `jsondiffpatch` to `diffpatch` for improved bundle sizes

## 1.1.0

* `FEAT`: provide pre-built CommonJS and ES module distributions

## 1.0.0

### Breaking Changes

* `FEAT`: migrate to ES modules. Use `esm` or a ES module aware transpiler to consume this library
* `CHORE`: expose `{ Differ, diff }` via module

### Other Improvements

* `CHORE`: use [min-dash](https://github.com/bpmn-io/min-dash) as the utility toolbelt

## 0.4.0

* `FIX`: correctly detect data object reference changes
* `FIX`: correctly detect waypoint additions / removals as layout changes
* `CHORE`: bump to `jsondiffpatch@0.3.9`

## ...

Check `git log` for earlier history.