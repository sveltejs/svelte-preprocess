## [3.0.2](https://github.com/kaisermann/svelte-preprocess/compare/v3.0.1...v3.0.2) (2019-08-29)


### Bug Fixes

* 🐛 inverted conditionals on typescript transformer ([a6937f0](https://github.com/kaisermann/svelte-preprocess/commit/a6937f0))



## [3.0.1](https://github.com/kaisermann/svelte-preprocess/compare/v3.0.0...v3.0.1) (2019-08-29)


### Bug Fixes

* 🐛 wrong typescript diagnostic filtering ([2630a44](https://github.com/kaisermann/svelte-preprocess/commit/2630a44)), closes [#49](https://github.com/kaisermann/svelte-preprocess/issues/49)



# [3.0.0](https://github.com/kaisermann/svelte-preprocess/compare/v2.16.0...v3.0.0) (2019-08-28)


### Performance Improvements

* ⚡️ make postcss-load-config optional for better pkg size ([7ab9c72](https://github.com/kaisermann/svelte-preprocess/commit/7ab9c72))


### BREAKING CHANGES

* To load PostCSS config automatically from a file, now it's needed to
manually install "postcss-load-config".



# [2.16.0](https://github.com/kaisermann/svelte-preprocess/compare/v2.15.2...v2.16.0) (2019-08-28)


### Features

* 🎸 add "transpileOnly" option to skip type check ([3e46741](https://github.com/kaisermann/svelte-preprocess/commit/3e46741)), closes [#54](https://github.com/kaisermann/svelte-preprocess/issues/54)



## [2.15.2](https://github.com/kaisermann/svelte-preprocess/compare/v2.15.0...v2.15.2) (2019-08-28)


### Bug Fixes

* 🐛 make pug mixins work with space AND tabs ([81b0154](https://github.com/kaisermann/svelte-preprocess/commit/81b0154))
* rename typescript configuration option to honor the readme docs ([67f2137](https://github.com/kaisermann/svelte-preprocess/commit/67f2137))



# [2.15.0](https://github.com/kaisermann/svelte-preprocess/compare/v2.14.4...v2.15.0) (2019-07-20)


### Features

* 🎸 add external src support for stand-alone processors ([974ab5a](https://github.com/kaisermann/svelte-preprocess/commit/974ab5a))



## [2.14.4](https://github.com/kaisermann/svelte-preprocess/compare/v2.14.3...v2.14.4) (2019-07-03)


### Features

* 🎸 allow to watch stylus dependencies ([8aa3dfc](https://github.com/kaisermann/svelte-preprocess/commit/8aa3dfc))



## [2.14.3](https://github.com/kaisermann/svelte-preprocess/compare/v2.14.2...v2.14.3) (2019-07-01)


### Bug Fixes

* 🐛 pass less [@imports](https://github.com/imports) as dependencies to svelte ([55e9d28](https://github.com/kaisermann/svelte-preprocess/commit/55e9d28))



## [2.14.2](https://github.com/kaisermann/svelte-preprocess/compare/v2.14.1...v2.14.2) (2019-06-29)


### Bug Fixes

* pug mixin elseif ([#45](https://github.com/kaisermann/svelte-preprocess/issues/45)) ([98ad9ca](https://github.com/kaisermann/svelte-preprocess/commit/98ad9ca))



## [2.14.1](https://github.com/kaisermann/svelte-preprocess/compare/v2.14.0...v2.14.1) (2019-06-28)


### Bug Fixes

* 🐛 transformer imported dependencies being overwritten ([423c17a](https://github.com/kaisermann/svelte-preprocess/commit/423c17a))



# [2.14.0](https://github.com/kaisermann/svelte-preprocess/compare/v2.13.1...v2.14.0) (2019-06-22)



## [2.13.1](https://github.com/kaisermann/svelte-preprocess/compare/v2.13.0...v2.13.1) (2019-06-21)



# [2.13.0](https://github.com/kaisermann/svelte-preprocess/compare/v2.12.0...v2.13.0) (2019-06-21)



# [2.12.0](https://github.com/kaisermann/svelte-preprocess/compare/v2.7.1...v2.12.0) (2019-06-03)


### Bug Fixes

* 🐛 template preprocessing running on the whole file ([e37da9d](https://github.com/kaisermann/svelte-preprocess/commit/e37da9d))


### Features

* 🎸 add support for typescript type checking ([#37](https://github.com/kaisermann/svelte-preprocess/issues/37)) ([e6dd744](https://github.com/kaisermann/svelte-preprocess/commit/e6dd744))
* 🎸 add svelte pug mixins ([#38](https://github.com/kaisermann/svelte-preprocess/issues/38)) ([543ab75](https://github.com/kaisermann/svelte-preprocess/commit/543ab75))
* 🎸 add typescript preprocessor ([c195aa1](https://github.com/kaisermann/svelte-preprocess/commit/c195aa1))
* prepend scss with data property ([#36](https://github.com/kaisermann/svelte-preprocess/issues/36)) ([dfa2b2a](https://github.com/kaisermann/svelte-preprocess/commit/dfa2b2a))



## [2.7.1](https://github.com/kaisermann/svelte-preprocess/compare/v2.6.5...v2.7.1) (2019-05-08)


### Bug Fixes

* 🐛 cut 90% of downloaded package size ([882a4dd](https://github.com/kaisermann/svelte-preprocess/commit/882a4dd))


### Features

* 🎸 watch internal files imported with postcss-import ([5b14624](https://github.com/kaisermann/svelte-preprocess/commit/5b14624))



## [2.6.5](https://github.com/kaisermann/svelte-preprocess/compare/v2.6.4...v2.6.5) (2019-05-05)


### Bug Fixes

* 🐛 stand-alone processors not exported ([ced0fd1](https://github.com/kaisermann/svelte-preprocess/commit/ced0fd1))



## [2.6.4](https://github.com/kaisermann/svelte-preprocess/compare/v2.6.3...v2.6.4) (2019-05-05)


### Bug Fixes

* 🐛 less and stylus stand-alone processor ([85827bb](https://github.com/kaisermann/svelte-preprocess/commit/85827bb))



## [2.6.3](https://github.com/kaisermann/svelte-preprocess/compare/v2.6.2...v2.6.3) (2019-05-01)


### Features

* support dart-sass ([e56f8b2](https://github.com/kaisermann/svelte-preprocess/commit/e56f8b2))



## [2.6.2](https://github.com/kaisermann/svelte-preprocess/compare/v2.5.2...v2.6.2) (2019-04-11)


### Bug Fixes

* 🐛 standalone processors breaking everything :) ([ce11323](https://github.com/kaisermann/svelte-preprocess/commit/ce11323))


### Features

* 🎸 add stand-alone processors ([f19c90a](https://github.com/kaisermann/svelte-preprocess/commit/f19c90a))



## [2.5.2](https://github.com/kaisermann/svelte-preprocess/compare/v2.5.1...v2.5.2) (2019-04-10)


### Features

* 🎸 support async onBefore() ([a6af2a2](https://github.com/kaisermann/svelte-preprocess/commit/a6af2a2))



## [2.5.1](https://github.com/kaisermann/svelte-preprocess/compare/v2.4.2...v2.5.1) (2019-04-02)


### Bug Fixes

* 🐛 custom transformer not working with external src files ([cc037c3](https://github.com/kaisermann/svelte-preprocess/commit/cc037c3))



## [2.4.2](https://github.com/kaisermann/svelte-preprocess/compare/v2.4.1...v2.4.2) (2018-11-03)



## [2.4.1](https://github.com/kaisermann/svelte-preprocess/compare/v2.4.0...v2.4.1) (2018-11-02)



# [2.4.0](https://github.com/kaisermann/svelte-preprocess/compare/v2.3.1...v2.4.0) (2018-11-01)



## [2.3.1](https://github.com/kaisermann/svelte-preprocess/compare/v2.2.2...v2.3.1) (2018-09-01)



## [2.2.2](https://github.com/kaisermann/svelte-preprocess/compare/v2.2.1...v2.2.2) (2018-07-18)



## [2.2.1](https://github.com/kaisermann/svelte-preprocess/compare/v2.2.0...v2.2.1) (2018-07-18)



# [2.2.0](https://github.com/kaisermann/svelte-preprocess/compare/v2.1.4...v2.2.0) (2018-07-18)



## [2.1.3](https://github.com/kaisermann/svelte-preprocess/compare/v2.1.0...v2.1.3) (2018-06-21)



# [2.1.0](https://github.com/kaisermann/svelte-preprocess/compare/v2.0.5...v2.1.0) (2018-06-20)



## [2.0.5](https://github.com/kaisermann/svelte-preprocess/compare/v2.0.4...v2.0.5) (2018-05-17)



## [2.0.4](https://github.com/kaisermann/svelte-preprocess/compare/v2.0.3...v2.0.4) (2018-05-17)



## [2.0.2](https://github.com/kaisermann/svelte-preprocess/compare/v2.0.1...v2.0.2) (2018-05-15)



## [2.0.1](https://github.com/kaisermann/svelte-preprocess/compare/1.1.2...v2.0.1) (2018-05-15)



## 1.1.2 (2018-05-14)



