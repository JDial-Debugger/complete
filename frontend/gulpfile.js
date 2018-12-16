// Node modules
const path = require('path')
const fs = require('fs')

// NPM modules
const gulp = require('gulp')
const del = require('del')
const sass = require('gulp-sass')
const cleanCSS = require('gulp-clean-css')
const standard = require('gulp-standard')
const concat = require('gulp-concat')
const rollupWrapper = require('gulp-rollup')
const rollup = require('rollup')
const babel = require('rollup-plugin-babel')
const rename = require('gulp-rename')
const minify = require('gulp-minify')

// Module's own package.json
const pkg = require('./package.json')

// Delete any files in the `./dist` directory. These includes any CSS files
// built from SCSS and bundled ECMAScript 5 files built from ES6
gulp.task('clean', () => {
  return del(path.join(pkg.paths.dist, '*'))
})

/**
 * BUILD TASKS
 *
 * The following tasks handle:
 *  - SCSS -> CSS
 *  - Checking that JS source files comply with the Standard JS rules
 *  - JS (ES6) -> JS (ES5)
 */

// Concatenate & minify all the vendor CSS stylesheets. All vendor modules are
// loaded via NPM and the paths to the particular browser-targeted files are
// described in this module's package.json
gulp.task('build-vendor-styles', () => {
  let components = pkg.paths.styles.components || {}

  // Gather a list of vendor JS files from package.json
  let src = Object.keys(components)
    .map((name) => {
      let filepath = path.join('node_modules', components[name])

      // Throws an error if a vendor's file doesn't exist
      try {
        fs.statSync(filepath)
      } catch (err) {
        console.error(err.toString())
      }

      return filepath
    })

  return gulp
    .src(src)
    .pipe(concat(pkg.paths.styles.vendors))
    .pipe(cleanCSS())
    .pipe(gulp.dest(pkg.paths.dist))
})

// Build CSS from the app's SCSS stylesheets. Store the result in `./dist`
gulp.task('styles', () => {
  return gulp
    .src(pkg.paths.styles.all)
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCSS())
    .pipe(rename(pkg.paths.styles.bundle))
    .pipe(gulp.dest(pkg.paths.dist))
})

// Check each JS source file to make sure it complies with the Standard JS style
// and formatting rules. The task also enforces the Standard JS style for
// config files
gulp.task('lint', () => {
  return gulp
    .src([
      pkg.paths.scripts.all,
      pkg.paths.config.gulpfile
    ])
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true,
      quiet: true
    }))
})

// Concatenate & minify all the vendor JS scripts. All vendor modules are loaded
// via NPM and the paths to the particular browser-targeted files are described
// in this module's package.json
gulp.task('build-vendor-scripts', () => {
  let components = pkg.paths.scripts.components || {}

  // Gather a list of vendor JS files from package.json
  let src = Object.keys(components)
    .map((name) => {
      let filepath = path.join('node_modules', components[name])

      // Throws an error if a vendor's file doesn't exist
      try {
        fs.statSync(filepath)
      } catch (err) {
        console.error(err.toString())
      }

      return filepath
    })

  return gulp
    .src(src)
    .pipe(minify({
      ext: '.min.js',
      noSource: true
    }))
    .pipe(concat(pkg.paths.scripts.vendors))
    .pipe(gulp.dest(pkg.paths.dist))
})

// Build a single, large JS file for the web app from smaller JS files. The
// source JS files are run through a few pre-processing stages:
//
//  1. Use the "rollup" module bundler to combine the files into a single large
//     file based on their dependency relationships.
//  2. Use the "babel" transpiler to convert files from more modern ES6 syntax
//     to a more accessible ES5 syntax.
//  3. Since the concatenation of multiple JS files and the transpilation from
//     ES6 -> ES5 can create a large final product, minify the result to
//     reduce app bandwidth
//
gulp.task('scripts', () => {
  return gulp
    .src(pkg.paths.scripts.all)
    .pipe(rollupWrapper({
      input: pkg.paths.scripts.main,
      output: {
	format: 'iife'
      },
      plugins: [
        babel({
          exclude: 'node_modules/**',
          presets: ['es2015-rollup']
        })
      ]
    }))
    .pipe(rename(pkg.paths.scripts.bundle))
    .pipe(minify({
      ext: '.js',
      noSource: true
    }))
    .pipe(gulp.dest('./dist'))
})

gulp.task('scripts-dev', (done) => {
  rollup.rollup({
    input: pkg.paths.scripts.main
  }).then((bundle) => {
    bundle.write({
      output: {
	format: 'iife'
      },
      dest: path.join(pkg.paths.dist, pkg.paths.scripts.bundle),
      sourceMap: true
    }).then(() => {
      done()
    })
  })
})

// A combined task for compiling JS and CSS vendor files
gulp.task('vendors', ['build-vendor-styles', 'build-vendor-scripts'])

// A combined task for compiling both JS and CSS
gulp.task('build', ['styles', 'vendors', 'scripts'])

/**
 * WATCH TASKS
 *
 * The following tasks can be used during active development to re-run given
 * commands whenever relevant source files change
 */

// A helper function to simplify the description of watch-tasks
function runTaskOnChange (filepaths, task) {
  return function () {
    return gulp.watch(filepaths, [task])
  }
}

// Run the `styles` task any time a SCSS file is changed
gulp.task('styles:watch', runTaskOnChange(pkg.paths.styles.all, 'styles'))

// Run the `lint` task any time a frontend JS file is changed
gulp.task('lint:watch', runTaskOnChange(pkg.paths.scripts.all, 'lint'))

// Run the `scripts` task any time a frontend JS file is changed
gulp.task('scripts:watch', runTaskOnChange(pkg.paths.scripts.all, 'scripts'))
gulp.task('scripts-dev:watch', runTaskOnChange(pkg.paths.scripts.all, 'scripts-dev'))
