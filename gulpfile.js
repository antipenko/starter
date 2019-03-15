"use strict";

var gulp = require('gulp'),
    watch = require('gulp-watch'),
    include = require("gulp-include"),
    prefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    htmlmin = require('gulp-htmlmin'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    imagemin = require('gulp-imagemin'),
    postcss = require('gulp-postcss'),
    pngquant = require('imagemin-pngquant'),
    rimraf = require('rimraf'),
    browserSync = require("browser-sync"),
    notify = require('gulp-notify'),
    argv = require('yargs').argv,
    $if = require('gulp-if'),
    stylelint = require('gulp-stylelint'),
    reload = browserSync.reload;

// Check for --p flag
var isProduction = !!(argv.p);

var path = {
    build: {
        html: 'build/',
        js: 'build/assets/js/',
        css: 'build/assets/css/',
        img: 'build/assets/img/',
        fonts: 'build/assets/fonts/'
    },
    src: {
        html: ['src/**/*.html', '!src/templates{,/**}'],
        js: 'src/assets/js/app.js',
        jsfolder: 'src/assets/js/',
        style: 'src/assets/style/app.scss',
        img: 'src/assets/img/**/*.*',
        fonts: 'src/assets/fonts/**/*.*',
        favicons: ['src/favicon.png','src/apple-touch-icon.png'],
    },
    watch: {
        html: 'src/**/*.html',
        js: 'src/assets/js/**/*.js',
        style: 'src/assets/style/**/*.*',
        img: 'src/assets/img/**/*.*',
        fonts: 'src/assets/fonts/**/*.*'
    },
    clean: './build',
    motionui: './node_modules/motion-ui/src',
    whatinput: './node_modules/what-input/dist/',
    slick: './node_modules/slick-carousel/slick',
    jquery: './node_modules/jquery/dist/',
    lightbox: './src/assets/js/lightbox.js',
    sourcemaps: '../sourcemaps'
};


var config = {
    server: {
        baseDir: "./build"
    },
    tunnel: false,
    host: 'localhost',
    port: 9000,
    logPrefix: "antipa-log"
};


gulp.task('webserver', function () {
    browserSync(config);
});

gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});

gulp.task('html:build', function () {
    gulp.src(path.src.html)
        .pipe(include({
                extensions: "html",
                hardFail: true,
            }).on('error', notify.onError(
            {
                message: "<%= error.message %>",
                title  : "HTML Error!"
            }
            )
            )
        )
        .pipe(
            $if(isProduction,
                htmlmin({collapseWhitespace: true, removeComments:true})
            )
        )
        .pipe(gulp.dest(path.build.html))
        .pipe(reload({stream: true}));
});

gulp.task('js:build', function () {
    gulp.src(path.src.js)
        .pipe(sourcemaps.init())
        .pipe(include({
                extensions: "js",
                hardFail: true,
                includePaths: [path.slick, path.lightbox, path.whatinput, path.jquery, path.src.jsfolder]
            }).on('error', notify.onError(
            {
                message: "<%= error.message %>",
                title  : "JS Error!"
            }
            )
            )
        )
        .pipe(
            $if(isProduction,
                uglify().on('error', notify.onError(
                    {
                        message: "<%= error.message %>",
                        title  : "JS Error!"
                    }
                    )
                )
            )
        )
        .pipe(
            $if(!isProduction, sourcemaps.write(path.sourcemaps))
        )
        .pipe(gulp.dest(path.build.js))
        .pipe(notify({ message: 'JS task complete', sound: false, onLast: true }))
        .pipe(reload({stream: true}));
});

gulp.task('style:build', function () {
    gulp.src(path.src.style)
        .pipe(sourcemaps.init())
        .pipe(sass({
            // outputStyle: 'compressed',
            precision: 8,
            //sourceMap: true,
            //errLogToConsole: true
            includePaths: [ path.motionui, path.slick],
        }).on( 'error', notify.onError(
            {
                message: "<%= error.message %>",
                title  : "Sass Error!"
            }
            )
        ))
        .pipe(prefixer())
        .pipe(
            $if(!isProduction, sourcemaps.write(path.sourcemaps))
        )
        // .pipe(cssmin())
        .pipe(gulp.dest(path.build.css))
        .pipe(notify({ message: 'Styles task complete', sound: false, onLast: true }))
        .pipe(reload({stream: true}));
});

gulp.task('image:build', function () {
    gulp.src(path.src.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(reload({stream: true}));
});

gulp.task('fonts:build', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
});

gulp.task('favicons:build', function() {
    gulp.src(path.src.favicons)
        .pipe(gulp.dest(path.build.html))
});

/* style lint*/

// Stylelint config rules
var stylelintConfig = {
    "rules": {
        "block-no-empty": true,
        "color-no-invalid-hex": true,
        "declaration-colon-space-after": "always",
        "declaration-colon-space-before": "never",
        "function-comma-space-after": "always",
        "function-url-quotes": "double",
        "media-feature-colon-space-after": "always",
        "media-feature-colon-space-before": "never",
        "media-feature-name-no-vendor-prefix": true,
        "max-empty-lines": 5,
        "number-leading-zero": "never",
        "number-no-trailing-zeros": true,
        "property-no-vendor-prefix": true,
        "rule-no-duplicate-properties": true,
        "declaration-block-no-single-line": true,
        "rule-trailing-semicolon": "always",
        "selector-list-comma-space-before": "never",
        "selector-list-comma-newline-after": "always",
        "selector-no-id": true,
        "string-quotes": "double",
        "value-no-vendor-prefix": true
    }
}
gulp.task('lint-scss', () => {
    return gulp.src('src/**/*.scss')
        .pipe(stylelint({
            failAfterError: false, // disable fail after error
            reporters: [
                {
                    formatter: 'string',
                    console: true
                },
                {
                    formatter: 'json', save: 'report.json'
                }
            ]
        }));
});

gulp.task('lint', function(){
    runseq(
        'lint-scss'
    );
});

/* style lint*/

gulp.task('build', [
    'html:build',
    'style:build',
    'lint-scss',
    'js:build',
    'image:build',
    'fonts:build',
    'favicons:build'
]);


gulp.task('watch', function(){
    console.log('test');
    watch(path.watch.html, function(event, cb) {
        gulp.start('html:build');
    });
    watch(path.watch.style, function(event, cb) {
        gulp.start('style:build');
    });
    watch(path.watch.style, function(event, cb) {
        gulp.start('lint-scss');
    });
    watch(path.watch.js, function(event, cb) {
        gulp.start('js:build');
    });
    watch(path.watch.img, function(event, cb) {
        gulp.start('image:build');
    });
    watch(path.watch.fonts, function(event, cb) {
        gulp.start('fonts:build');
    });
    watch(path.src.favicons, function(event, cb) {
        gulp.start('favicons:build');
    });
});


gulp.task('default', ['build', 'webserver', 'watch']);
