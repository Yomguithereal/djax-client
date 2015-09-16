var gulp = require('gulp'),
    mocha = require('gulp-mocha-phantomjs'),
    header = require('gulp-header'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    api = require('./test/api.js'),
    pkg = require('./package.json');

// Building tests
gulp.task('build-tests', function() {
  return browserify({
    entries: './test/unit.js',
    debug: true
  }).transform(babelify)
    .bundle()
    .pipe(source('djax-client.unit.js'))
    .pipe(gulp.dest('./test/build'));
});

// Testing
gulp.task('test', ['build-tests'], function() {
  var server = api.listen(7337);

  var close = function() {server.close();},
      stream = mocha();

  stream.write({path: 'http://localhost:7337/static/unit.html'});
  stream.on('error', close);
  stream.on('end', close);
  stream.end();

  return stream;
});

// Watching
gulp.task('watch-tests', ['build-tests'], function() {
  api.listen(7337);
  gulp.watch(['./djax-client.js', './test/unit.js'], ['build-tests']);
});

// Building
gulp.task('build', function() {
  return browserify({
    entries: './djax-client.js',
    standalone: 'DjaxClient',
  }).transform(babelify)
    .bundle()
    .pipe(source('djax-client.concat.js'))
    .pipe(gulp.dest('./'))
    .pipe(rename('djax-client.min.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(header('/* djax-client- Version: ' + pkg.version + ' - Author: Yomguithereal (Guillaume Plique) */\n'))
    .pipe(gulp.dest('./'));
});
