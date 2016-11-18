import babel from 'gulp-babel'
import del from 'del'
import gulp from 'gulp'
import sass from 'gulp-sass'
import standard from 'gulp-standard'
import webpack from 'webpack-stream'
import webpackConfig from './webpack.config.babel'
import pkg from './package.json'

const PATHS = {
  scripts: {
    // source files
    all: 'src/scripts/**/*.js',
    client: 'src/scripts/client/**/*.js',
    server: 'src/scripts/server/**/*.js',
    shared: 'src/scripts/shared/**/*.js',
    clientEntry: 'src/scripts/client/app-view.js',
    clientBundle: 'dist/client.js(.map)',

    // config files
    gulpFile: 'gulpfile.babel.js',
    webpackFile: 'webpack.config.babel.js',

    // directories
    libDir: 'lib',
    distDir: 'dist'
  },
  styles: {
    all: 'src/styles/**/*.scss',
    stylesheetEntry: 'src/styles/style.scss',
    stylesheetBundle: 'dist'
  }
}

gulp.task('lint', () => {
  let files = pkg.standard.ignore.map(function (i) { return '!' + i })
  files.unshift(PATHS.scripts.all)
  files.push(PATHS.scripts.gulpFile)
  files.push(PATHS.scripts.webpackFile)

  return gulp.src(files)
  .pipe(standard())
  .pipe(standard.reporter('default', {
    breakOnError: true,
    quiet: true
  }))
})

gulp.task('clean-scripts', () => del([
  PATHS.scripts.libDir,
  PATHS.scripts.clientBundle
]))

gulp.task('clean-styles', () => del([
  PATHS.styles.stylesheetBundle
]))

gulp.task('build-scripts', [
  'lint',
  'clean-scripts'
], () => {
  gulp.src([
    PATHS.scripts.all
  ])
  .pipe(babel())
  .pipe(gulp.dest(PATHS.scripts.libDir))
})

gulp.task('build-styles', () => {
  gulp.src([
    PATHS.styles.stylesheetEntry
  ])
  .pipe(sass())
  .pipe(gulp.dest(PATHS.styles.stylesheetBundle))
})

gulp.task('main', () => {
  gulp.src([
    PATHS.scripts.clientEntry
  ])
  .pipe(webpack(webpackConfig))
  .pipe(gulp.dest(PATHS.scripts.distDir))
})

gulp.task('default', () => {
  gulp.watch(PATHS.scripts.all, ['lint', 'main'])
})
