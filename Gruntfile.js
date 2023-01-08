module.exports = function (grunt) {
    // load plugins
    [
        "grunt-mocha-test",
        "grunt-contrib-jshint",
        "grunt-contrib-less",
        "grunt-contrib-uglify",
        "grunt-contrib-cssmin",
        "grunt-hashres",
        "grunt-lint-pattern",
    ].forEach(function (task) {
        grunt.loadNpmTasks(task);
    });
    // configure plugins
    grunt.initConfig({
        mochaTest: {
            all: {
                src: "qa/tests-*.js",
                options: { ui: "tdd", run: true, log: true, timeout: 10000 },
            },
        },
        less: {
            development: {
                options: {
                    customFunctions: {
                        static: (lessObject, name) =>
                            `url(${require("./lib/static").map(name.value)})`,
                    },
                },
                files: {
                    "public/stylesheet/main.css": "less/main.less",
                    "public/stylesheet/cart.css": "less/cart.less",
                },
            },
        },
        uglify: {
            all: {
                files: {
                    "public/js/ny-travel.min.js": ["public/js/**/*.js"],
                },
            },
        },
        cssmin: {
            combine: {
                files: {
                    "public/stylesheet/ny-travel.css": [
                        "public/stylesheet/**/*.css",
                        "!public/stylesheet/ny-travel*.css",
                    ],
                },
            },
            minify: {
                src: "public/stylesheet/ny-travel.css",
                dest: "public/stylesheet/ny-travel.min.css",
            },
        },
        hashres: {
            options: {
                fileNameFormat: "${name}.${hash}.${ext}",
            },
            all: {
                src: [
                    "public/js/ny-travel.min.js",
                    "public/stylesheet/ny-travel.min.css",
                ],
                dest: ["views/layouts/main.hbs"],
            },
        },

        jshint: {
            options: {
                esversion: 6,
            },
            app: ["app.js", "public/js/**/*.js", "lib/**/*.js"],
            qa: ["Gruntfile.js", "public/qa/**/*.js", "qa/**/*.js"],
        },
        lint_pattern: {
            view_statics: {
                options: {
                    rules: [
                        {
                            pattern: /<link [^>]*href=["'](?!\{\{static )/,
                            message:
                                "Un-mapped static resource found in <link>.",
                        },
                        {
                            pattern: /<script [^>]*src=["'](?!\{\{static )/,
                            message:
                                "Un-mapped static resource found in <script>.",
                        },
                        {
                            pattern: /<img [^>]*src=["'](?!\{\{static )/,
                            message:
                                "Un-mapped static resource found in <img>.",
                        },
                    ],
                },
                files: {
                    src: ["views/**/*.handlebars"],
                },
            },
            css_statics: {
                options: {
                    rules: [
                        {
                            pattern: /url\(/,
                            message: "Un-mapped static found in LESS property.",
                        },
                    ],
                },
                files: {
                    src: ["less/**/*.less"],
                },
            },
        },
    });
    // register tasks
    grunt.registerTask("default", ["mochaTest", "jshint", "lint_pattern"]);
    grunt.registerTask("static", ["less", "cssmin", "uglify", "hashres"]);
};
