var del          = require('del');
var run          = require('run-sequence');

var gulp         = require('gulp');
var plumber      = require('gulp-plumber');
var svgstore     = require('gulp-svgstore');
var svgmin       = require('gulp-svgmin');
var change       = require('gulp-change');



var generalSymbols = '';
var themeSymbols = '';

function saveGeneralSymbols(content) {
    generalSymbols = content.replace('<svg', '<svg style="display: none;"');
}

function saveThemeSymbols(content) {
    themeSymbols = content.replace('<svg', '<svg style="display: none;"');
}


function injectGeneralSymbols(content) {

    var source = content.split('\n');
    var result = '';

    source.forEach(function (line) {

        if( line.indexOf('<body') !== -1 ) {
            result += line + '\n' + '        ' + generalSymbols + '\n';
        }
        else {
            result += line + '\n';
        }

    });

    return result;
}

function injectThemeSymbols(content) {
    var source = content.split('\n');
    var result = '';

    source.forEach(function (line) {

        if( line.indexOf('<body') !== -1 ) {
            result += line + '\n' + '        ' + themeSymbols + '\n';
        }
        else {
            result += line + '\n';
        }

    });

    return result;
}

function symbolsImgToSpriteSvg(content) {

    var source = content.split('\n');
    var outputLine = [];
    var result = '';
    var folder = '';

    var i;
    var indentString;
    var classString;
    var idString;
    var widthString;
    var heightString;
    var titleString;
    var srcString;
    var pathString;
    var nameString;
    var timestamp = Math.round(new Date().getTime() / 1000);

    source.forEach(function (line) {

        if( line.indexOf('general/') !== -1 || line.indexOf('theme/') !== -1) {

            if ( line.indexOf('general/') !== -1 ) {
                folder = 'general';
            }

            if ( line.indexOf('theme/') !== -1 ) {
                folder = 'theme';
            }

            /* get indent */

            for (indentString = '', i = 0; i < line.indexOf('<img'); i++ ) {
                indentString += ' ';
            }


            /* get attributes */

            classString  = line.match( 'class[ \t]*=[ \t]*"[^"]+"');
            idString     = line.match(    'id[ \t]*=[ \t]*"[^"]+"');
            widthString  = line.match( 'width[ \t]*=[ \t]*"[^"]+"');
            heightString = line.match('height[ \t]*=[ \t]*"[^"]+"');
            titleString  = line.match( 'title[ \t]*=[ \t]*"[^"]+"');

            classString  = classString  ? classString[0]  : null;
            idString     = idString     ? idString[0]     : null;
            widthString  = widthString  ? widthString[0]  : null;
            heightString = heightString ? heightString[0] : null;
            titleString  = titleString  ? titleString[0]  : null;


            /* get path and name */

            srcString = line.match('src[ \t]*=[ \t]*"[^"]+"');
            srcString = srcString[0];
            srcString = srcString.replace('src="', '');
            srcString = srcString.replace('"', '');

            nameString = srcString.replace(/^.*[\\\/]/, '');
            nameString = nameString.replace('.svg', '');

            pathString = srcString.replace(nameString + '.svg', '');


            /* write down results */

            outputLine[0] = '<svg' + ( classString ? ' ' + classString : '') + ( idString ? ' ' + idString : '') + ( widthString ? ' ' + widthString : '') + ( heightString ? ' ' + heightString : '') + '>';
            outputLine[1] = '<use xlink:href="#' + nameString + '"></use>';
            outputLine[2] = '</svg>';

            // result += outputLine[0] + '\n' + outputLine[1] + '\n' + outputLine[2] + '\n';
            result += outputLine[0] + outputLine[1] + outputLine[2] + '\n';
        }
        else {
            result += line + '\n';
        }

    });

    return result;
}


// Clean up production folder

gulp.task('clean', function() {
  return del('production/*');
});


// Layouts: copy and change symbols <img> to sprite <svg>

gulp.task('layouts', function() {
  return gulp.src('development/*.html')
      .pipe(plumber())
      .pipe(change(symbolsImgToSpriteSvg))
      .pipe(change(injectGeneralSymbols))
      .pipe(change(injectThemeSymbols))
      .pipe(gulp.dest('production/'))
  ;
});



// general

gulp.task('general', function() {
    return gulp.src('development/general/*.svg')
        .pipe(plumber())
        .pipe(svgmin())
        .pipe(svgstore({ inlineSvg: true }))
        .pipe(change(saveGeneralSymbols))
        .pipe(gulp.dest('production/general/'));
});


// theme

gulp.task('theme', function() {
    return gulp.src('development/theme/*.svg')
        .pipe(plumber())
        .pipe(svgmin())
        .pipe(svgstore({ inlineSvg: true }))
        .pipe(change(saveThemeSymbols))
        .pipe(gulp.dest('production/theme/'));
});


gulp.task('default', function (fn) {
  run('clean', 'general', 'theme', 'layouts', fn);
});



