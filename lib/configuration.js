/*------------------------------------*\
    CONFIGURATION
\*------------------------------------*/
/* jslint node: true */

/**
 * Set required variables for application and CLI language messages.
 * @private
 * @function initRequiredVars
 * @memberOf NA#
 * @this NA
 */
exports.initRequiredVars = function () {
    var NA = this,
        path = NA.modules.path;

    /**
     * Name of file which contains language error messages. The name of file is without extension.
     * @private
     * @alias cliLanguage
     * @type {string}
     * @memberOf NA#
     * @default "default"
     */
    NA.cliLanguage = "default";

    /**
     * All internationalize labels from `NA#cliLanguage` file.
     * @private
     * @alias cliLabels
     * @type {Object}
     * @memberOf NA#
     */
    NA.cliLabels = require("../languages/" + NA.cliLanguage + ".json");

    /**
     * OS absolute path which contains NodeAtlas folders and files.
     * @public
     * @alias nodeatlasPath
     * @type {string}
     * @memberOf NA#
     * @default « The path where `node-atlas` module is. »
     */
    NA.nodeatlasPath = path.join(__dirname, "..");

    /**
     * Contain all functions of controllers both common and specific.
     * @namespace controllers[]
     * @private
     * @alias controllers
     * @type {Array.<Object>}
     * @memberOf NA#
     * @example // Functions for common controller if common `controller` value is "common.json".
     * NA.controllers["common.json"].setModules(...);
     * NA.controllers["common.json"].setSessions(...);
     * NA.controllers["common.json"].setSockets(...);
     * NA.controllers["common.json"].setConfigurations(...);
     * NA.controllers["common.json"].setRoutes(...);
     * NA.controllers["common.json"].changeVariations(...);
     * NA.controllers["common.json"].changeDom(...);
     *
     * // Functions for specific controller if a route `controller` value is "index.json".
     * NA.controllers["index.json"].setSockets(...);
     * NA.controllers["index.json"].changeVariations(...);
     * NA.controllers["index.json"].changeDom(...);
     */
    NA.controllers = [];
};

/**
 * Set command line options usable when NodeAtlas is executed as CLI.
 * @private
 * @function initCliConfiguration
 * @memberOf NA#
 * @this NA
 */
exports.initCliConfiguration = function () {
    var NA = this,
        commander = NA.modules.commander,
        commands = [
            "lang",
            "generate",
            "create",
            "httpSecure",
            "browse",
            "cache",
            "directory",
            "webconfig",
            "httpHostname",
            "httpPort",
        ],
        i;

    commander

        /* Version of NodeAtlas currently in use with `--version` option. */
        .version("v2.0.0")

        /* Automaticly run default browser with `--browse` options. If a param is setted, the param is added to the and of url. */
        .option(NA.cliLabels.commander.browse.command, NA.cliLabels.commander.browse.description, String)

        /* Target the directory in which website and NodeAtlas will be running. */
        .option(NA.cliLabels.commander.directory.command, NA.cliLabels.commander.directory.description, String)

        /* Change name of JSON file used as the webconfig file. */
        .option(NA.cliLabels.commander.webconfig.command, NA.cliLabels.commander.webconfig.description, String)

        /* Change the hostname that runs the NodeAtlas website. */
        .option(NA.cliLabels.commander.httpHostname.command, NA.cliLabels.commander.httpHostname.description, String)

        /* Change the port that runs the NodeAtlas website. */
        .option(NA.cliLabels.commander.httpPort.command, NA.cliLabels.commander.httpPort.description, String)

        /* Minify all files and re-create all HTML assets into generates folder. */
        .option(NA.cliLabels.commander.generate.command, NA.cliLabels.commander.generate.description)

        /* Avoid cache at all levels (Server, Template Engine...). */
        .option(NA.cliLabels.commander.cache.command, NA.cliLabels.commander.cache.description)

        /* Copy all data from `test/<project-name>` from NodeAtlas package to current directory. */
        .option(NA.cliLabels.commander.create.command, NA.cliLabels.commander.create.description)

        /* Start the server with HTTPs Protocol. */
        .option(NA.cliLabels.commander.httpSecure.command, NA.cliLabels.commander.httpSecure.description)

        /* Change language used by NodeAtlas. */
        .option(NA.cliLabels.commander.lang.command, NA.cliLabels.commander.lang.description)
        .parse(process.argv);

    /* `NA#configuration.xxx` setted from `--xxx`. */
    for (i = 0; i < commands.length; i++) {    
        if (commander[commands[i]]) {
            NA.configuration[commands[i]] = commander[commands[i]];
        }
    }
};

/**
 * Set required variables for the webconfig depending of NPM modules.
 * @private
 * @function initRequiredNpmModulesVars
 * @memberOf NA#
 * @this NA
 */
exports.initRequiredNpmModulesVars = function () {
    var NA = this,
        path = NA.modules.path;

    if (typeof NA.configuration.directory !== "string") {

        /**
         * System files path to the NodeAtlas project directory (webconfig + website folder tree).
         * @public
         * @alias serverPath
         * @type {string}
         * @memberOf NA#
         * @default « System files path from NodeAtlas is called ».
         */
        NA.serverPath = path.join(process.cwd(), "/");
    } else {

        /* `NA#serverPath` setted from CLI command parameters or API configuration options. */
        NA.serverPath = path.join(NA.configuration.directory, "/");
    }

    /**
     * Name of the webconfig used for run the NodeAtlas project website.
     * @public
     * @alias webconfigName
     * @type {string}
     * @memberOf NA#
     * @default "webconfig.json".
     */
    NA.webconfigName = "webconfig.json";

    /* `webconfigName` manually setted value with `NA#config`. */
    if (NA.configuration.webconfig) {
        NA.webconfigName = NA.configuration.webconfig;
    }
};

/**
 * Decide to run a « Simple Web Server » or a « With Weconfig Server » depending to webconfig opening success.
 * If webconfig is correctly openned, the `NA#createWebconfig` and `callback` function will be run, else, just `NA#simpleWebServer` will be run.
 * @private
 * @function initWebsite
 * @memberOf NA#
 * @this NA
 * @param {NA~callback} next Called if webconfig is correctly openned.
 */
exports.initWebsite = function (next) {
    var NA = this;

    /* Webconfig based website... */
    NA.ifFileExist(NA.serverPath, NA.webconfigName, function (err) {
        if (err && err.code === 'ENOENT') {

            /* ... or static website. */
            return NA.simpleWebServer();
        }

        /* Construction of webconfig. */
        NA.createWebconfig();

        next();
    });
};

/**
 * Set modules and NPM modules used by NodeAtlas project.
 * @private
 * @function initServerModules
 * @memberOf NA#
 * @this NA
 */
exports.initServerModules = function () {
    var NA = this;

    /* Open `common` controller. */
    NA.openController(

        /**
         * Name of file for `common` controller.
         * @public
         * @alias controller
         * @type {string}
         * @memberOf NA#webconfig
         */
        NA.webconfig.controller);

    /**
     * Folder which contain the `node-atlas` node modules.
     * @public
     * @alias nodeatlasModulesRelativePath
     * @type {string}
     * @memberOf NA#
     * @default "node_modules/"
     */
    NA.nodeatlasModulesRelativePath = "node_modules/";

    /**
     * Folder which contain the current website node modules.
     * @public
     * @alias serverModulesRelativePath
     * @type {string}
     * @memberOf NA#
     * @default "node_modules/"
     */
    NA.serverModulesRelativePath = "node_modules/";

    /* Use the `NA.controllers[<controller>].setModules(...)` function if set... */
    if (typeof NA.controllers[NA.webconfig.controller] !== 'undefined' &&
        typeof NA.controllers[NA.webconfig.controller].setModules !== 'undefined') {

        /**
         * Define this function for adding npm module into `NA.modules` of application. Only for `common` controller file.
         * @function setModules
         * @memberOf NA#controllers[]
         */
        NA.controllers[NA.webconfig.controller].setModules.call(NA);
    }
};

/**
 * Set routes, statics and prefix routes.
 * @private
 * @function setWebconfigRoutes
 * @memberOf NA~
 */
function setWebconfigRoutes(NA) {
    var path = NA.modules.path,
        url = NA.modules.url;

    /**
     * Adding subfolder to original url.
     * @public
     * @alias urlRelativeSubPath
     * @type {string}
     * @memberOf NA#webconfig
     * @default ""
     * @example
     * // If `NA#webconfig.urlRelativeSubPath` is setted to "example"
     * // Website will run by default to « http://localhost/example »
     */
    if (NA.webconfig.urlRelativeSubPath) {
        NA.webconfig.urlRelativeSubPath = url.format(path.join("/", NA.webconfig.urlRelativeSubPath)).replace(/\/+$/g, "");
    } else {
        NA.webconfig.urlRelativeSubPath = "";
    }

    if (typeof NA.webconfig.routes === "string") {

        /**
         * Contain all routes into an Object or an Array depending how the intial format setted.
         * @public
         * @alias routes
         * @type {Object|Array}
         * @memberOf NA#webconfig
         * @default « The webconfig's object property `routes` »
         */
        NA.webconfig.routes = NA.openConfiguration(NA.webconfig.routes);
    }

    if (typeof NA.webconfig.statics === "string") {

        /**
         * Contain all statics files into an Object or an Array depending how the intial format setted.
         * @public
         * @alias statics
         * @type {Object|Array}
         * @memberOf NA#webconfig
         * @default « The webconfig's object property `statics` »
         */
        NA.webconfig.statics = NA.openConfiguration(NA.webconfig.statics);
    }
}

/**
 * Set bundles and optimizations.
 * @private
 * @function setWebconfigCompressions
 * @memberOf NA~
 */
function setWebconfigCompressions(NA) {

    if (typeof NA.webconfig.bundles === 'string') {

        /**
         * Configuration for CSS minification/bundle and JS obfuscation/bundle.
         * @public
         * @alias bundles
         * @type {Object}
         * @memberOf NA#webconfig
         * @property {Object} bundles             The bundles object.
         * @property {Object} bundles.javascripts Each object name represent an output javascript file and each property of object represent an array of inputs files.
         * @property {Object} bundles.stylesheets Each object name represent an output stylesheet file and each property of object represent an array of inputs files.
         * @example {
         *     "javascripts": {
         *         "javascript/framework.min.js": [
         *             "javascript/modernizr.js",
         *             "javascript/jquery.js",
         *             "javascript/prettify.js",
         *             "javascript/prettify/run_prettify.js"
         *         ],
         *         "javascript/common.min.js": [
         *             "javascript/components/extended-format-date.js",
         *             "javascript/common.js"
         *         ]
         *     },
         *     "stylesheets": {
         *         "stylesheets/common.min.css": [
         *             "stylesheets/common.css",
         *             "stylesheets/common-min780.css",
         *             "stylesheets/common-min1160.css"
         *         ]
         *     }
         * }
         */
        NA.webconfig.bundles = NA.openConfiguration(NA.webconfig.bundles);
    }

    if (typeof NA.webconfig.optimizations === 'string') {

        /**
         * Configuration for Images optimizations.
         * @public
         * @alias optimizations
         * @type {Object}
         * @memberOf NA#webconfig
         * @property {Object} optimizations        The optimizations object.
         * @property {Object} optimizations.images Each object name represent an input image file and object value represent an output folder.
         * @example {
         *     "jpg": { "progressive": true },
         *     "gif": { "interlaced": true },
         *     "png": { "optimizationLevel": 3 },
         *     "svg": { "multipass": true },
         *     "images": {
         *         "media/images/*.{gif,jpg,png,svg}": "media/images/optimized/"
         *     }
         * }
         */
        NA.webconfig.optimizations = NA.openConfiguration(NA.webconfig.optimizations);
    }
}

/**
 * Set pug, less and enbaleStylus.
 * @private
 * @function setWebconfigPreprocessors
 * @memberOf NA~
 */
function setWebconfigPreprocessors(NA) {

    /**
     * Enable Pug preprocessor.
     * @public
     * @alias pug
     * @type {boolean}
     * @memberOf NA#webconfig
     * @default false
     */
    NA.webconfig.pug = NA.webconfig.pug || false;

    if (NA.webconfig.less === true) {

        /**
         * Enable Less preprocessor.
         * @namespace less
         * @public
         * @alias less
         * @type {boolean|Object}
         * @memberOf NA#webconfig
         * @default false
         * @property {boolean}        compress  Minify the Less file.
         * @property {boolean}        sourceMap Create a sourceMap file for development.
         * @property {Array.<string>} files     The file for compilation in an Array.
         */
        NA.webconfig.less = {
            compress: false,
            sourceMap: true
        };
    } else if (typeof NA.webconfig.less === "object" && typeof NA.webconfig.less.files === "string") {

        /**
         * Contain Less files required for compilation.
         * @public
         * @alias files
         * @type {Array.<string>}
         * @memberOf NA#webconfig.less
         * @example {
         *     "files": [
         *         "stylesheets/common.less",
         *         "stylesheets/component-1.less",
         *         "stylesheets/component-2.less",
         *         "stylesheets/component-3.less"
         *     ]
         * }
         */
        NA.webconfig.less.files = NA.openConfiguration(NA.webconfig.less.files);
    }

    if (NA.webconfig.stylus === true) {

        /**
         * Enable Stylus preprocessor.
         * @namespace stylus
         * @public
         * @alias stylus
         * @type {boolean|Object}
         * @memberOf NA#webconfig
         * @default false
         * @property {boolean}        compress  Minify the Stylus file.
         * @property {boolean}        sourceMap Create a sourceMap file for development.
         * @property {Array.<string>} files The file for compilation in an Array.
         */
        NA.webconfig.stylus = {
            compress: false,
            sourceMap: true
        };
    } else if (typeof NA.webconfig.stylus === 'object' && typeof NA.webconfig.stylus.files === 'string') {

        /**
         * Contain Stylus files required for compilation.
         * @public
         * @alias files
         * @type {Array.<string>}
         * @memberOf NA#webconfig.stylus
         * @example {
         *     "files": [
         *         "stylesheets/common.styl",
         *         "stylesheets/component-1.styl",
         *         "stylesheets/component-2.styl",
         *         "stylesheets/component-3.styl"
         *     ]
         * }
         */
        NA.webconfig.stylus.files = NA.openConfiguration(NA.webconfig.stylus.files);
    }
}

/**
 * Set NodeAtlas directory names.
 * @private
 * @function setWebconfigDirectories
 * @memberOf NA~
 */
function setWebconfigDirectories(NA) {

    if (typeof NA.webconfig.variationsRelativePath === "undefined") {

        /**
         * Language and variable variation files folder depending of languages.
         * @public
         * @alias variationsRelativePath
         * @type {string}
         * @memberOf NA#webconfig
         * @default "variations"
         */
        NA.webconfig.variationsRelativePath = "variations";
    }

    if (typeof NA.webconfig.controllersRelativePath === "undefined") {

        /**
         * Controller folder for Back-end part.
         * @public
         * @alias controllersRelativePath
         * @type {string}
         * @memberOf NA#webconfig
         * @default "controllers"
         */
        NA.webconfig.controllersRelativePath = "controllers";
    }

    if (typeof NA.webconfig.middlewaresRelativePath === "undefined") {

        /**
         * Controller folder for Middlewares part.
         * @public
         * @alias middlewaresRelativePath
         * @type {string}
         * @memberOf NA#webconfig
         * @default "middlewares"
         */
        NA.webconfig.middlewaresRelativePath = "middlewares";
    }

    /* Path to view. */
    if (typeof NA.webconfig.viewsRelativePath === "undefined") {

        /**
         * View folder for Template Engine files.
         * @public
         * @alias viewsRelativePath
         * @type {string}
         * @memberOf NA#webconfig
         * @default "views"
         */
        NA.webconfig.viewsRelativePath = "views";
    }

    if (typeof NA.webconfig.assetsRelativePath === "undefined") {

        /**
         * Folder for public file like images, CSS, JS...
         * @public
         * @alias assetsRelativePath
         * @type {string}
         * @memberOf NA#webconfig
         * @default "assets"
         */
        NA.webconfig.assetsRelativePath = "assets";
    }

    if (typeof NA.webconfig.serverlessRelativePath === "undefined") {

        /**
         * HTML assets generation Folder.
         * @public
         * @alias serverlessRelativePath
         * @type {string}
         * @memberOf NA#webconfig
         * @default "serverless"
         */
        NA.webconfig.serverlessRelativePath = "serverless";
    }
}

/**
 * Set HTTP Port and HTTP hostname.
 * @private
 * @function setWebconfigHost
 * @memberOf NA~
 */
function setWebconfigHost(NA) {
    var defaultPort = NA.webconfig.httpSecure ? 443 : 80;

    /**
     * Server listening port.
     * @public
     * @alias httpPort
     * @type {string}
     * @memberOf NA#webconfig
     * @default « The webconfig's property `httpPort` » || « The `process.env.PORT` if setted » || « 443/80 default port »
     */
    NA.webconfig.httpPort = NA.configuration.httpPort || NA.webconfig.httpPort || process.env.PORT || defaultPort;

    /**
     * Url access port (for reverse proxy).
     * @public
     * @alias urlPort
     * @type {string}
     * @memberOf NA#webconfig
     * @default undefined
     */
    NA.webconfig.urlPort = NA.webconfig.urlPort || NA.webconfig.httpPort;

    /**
     * Server listening hostname by HTTP.
     * @public
     * @alias httpHostname
     * @type {string}
     * @memberOf NA#webconfig
     * @default « The webconfig's property `httpHostname` » || « The `process.env.IP_ADDRESS` if setted » || "localhost";
     */
    NA.webconfig.httpHostname = NA.configuration.httpHostname || NA.webconfig.httpHostname || process.env.IP_ADDRESS || "localhost";

    /**
     * Url access hostname (for reverse proxy).
     * @public
     * @alias urlHostname
     * @type {string}
     * @memberOf NA#webconfig
     * @default undefined
     */
    NA.webconfig.urlHostname = NA.webconfig.urlHostname || NA.webconfig.httpHostname;
}

/**
 * Set default Cache and Secure.
 * @private
 * @function setWebconfigSecure
 * @memberOf NA~
 */
function setWebconfigSecure(NA) {

    /**
     * Avoil all caching at all level (server, template engine...). Do not use in production.
     * @public
     * @alias cache
     * @type {boolean}
     * @memberOf NA#webconfig
     * @default false
     */
    NA.webconfig.cache = NA.configuration.cache || NA.webconfig.cache || false;

    /**
     * Define is site is running with HTTP(S) protocol.
     * @public
     * @alias httpSecure
     * @type {boolean|string|Object}
     * @memberOf NA#webconfig
     * @default false
     */
    NA.webconfig.httpSecure = NA.configuration.httpSecure || NA.webconfig.httpSecure || false;

    /**
     * Define the path to the Private Key for HTTPs.
     * @public
     * @alias httpSecureKeyRelativePath
     * @type {string}
     * @memberOf NA#webconfig
     */
    NA.webconfig.httpSecureKeyRelativePath = NA.webconfig.httpSecureKeyRelativePath || ((typeof NA.webconfig.httpSecure === "string") ? NA.webconfig.httpSecure + ".key" : null);

    /**
     * Define the path to the Certificate for HTTPs.
     * @public
     * @alias httpSecureCertificateRelativePath
     * @type {string}
     * @memberOf NA#webconfig
     */
    NA.webconfig.httpSecureCertificateRelativePath = NA.webconfig.httpSecureCertificateRelativePath || ((typeof NA.webconfig.httpSecure === "string") ? NA.webconfig.httpSecure + ".crt" : null);
}

/**
 * Set the mimeType, charset and headers.
 * @private
 * @function setWebconfigHeaders
 * @memberOf NA~
 */
function setWebconfigHeaders(NA) {

    /**
     * Default Content-Type used for all pages.
     * @public
     * @alias mimeType
     * @type {string}
     * @memberOf NA#webconfig
     * @default "text/html"
     */
    NA.webconfig.mimeType = NA.webconfig.mimeType || "text/html";

    /**
     * Default Charset used for all pages.
     * @public
     * @alias charset
     * @type {string}
     * @memberOf NA#webconfig
     * @default "utf-8"
     */
    NA.webconfig.charset = NA.webconfig.charset || "utf-8";

    /**
     * Default Headers used for all pages.
     * @public
     * @alias headers
     * @type {Object}
     * @memberOf NA#webconfig
     * @default {}
     */
    NA.webconfig.headers = NA.webconfig.headers || {};
}

/**
 * Set all default webconfig's value into `NA#webconfig`.
 * @private
 * @function createWebconfig
 * @memberOf NA#
 */
exports.createWebconfig = function () {
    var NA = this,
        ejs = NA.modules.ejs;

    /**
     * Content of Webconfig file enhenced by `NA#configuration` and CLI commands.
     * @namespace webconfig
     * @public
     * @alias webconfig
     * @type {Object}
     * @memberOf NA#
     */
    NA.webconfig = NA.openConfiguration(NA.webconfigName);

    /* Set all webconfig parameters. */
    setWebconfigRoutes(NA);
    setWebconfigCompressions(NA);
    setWebconfigPreprocessors(NA);
    setWebconfigDirectories(NA);
    setWebconfigHost(NA);
    setWebconfigSecure(NA);
    setWebconfigHeaders(NA);

    /**
     * Set open and close bracket used by Teplate Engine.
     * @public
     * @alias templateEngineDelimiter
     * @type {string}
     * @memberOf NA#webconfig
     * @default "?"
     */
    ejs.delimiter = NA.webconfig.templateEngineDelimiter || (

        /**
         * Set a custom template engine.
         * @public
         * @alias engine
         * @type {string}
         * @memberOf NA#webconfig
         * @default undefined
         */
        NA.webconfig.engine ? "%" : "?");

    /**
     * Deliver the client-side window.NA.socket and window.NA.io object.
     * @public
     * @alias urlSocketsFile
     * @type {string}
     * @memberOf NA#webconfig
     * @default "/node-atlas/socket.io.js"
     */
    NA.webconfig.urlSocketsFile = (NA.webconfig.urlSocketsFile === false) ? false : (NA.webconfig.urlSocketsFile || "/node-atlas/socket.io.js");

    /**
     * Website http(s) absolute url based from `NA#webconfig.httpSecure`, `NA#webconfig.urlHostname` and `NA#webconfig.urlPort`.
     * This value does not contain `NA#webconfig.urlRelativeSubPath`.
     * @public
     * @alias urlRoot
     * @type {string}
     * @memberOf NA#webconfig
     */
    NA.webconfig.urlRoot = 'http' + ((NA.webconfig.httpSecure) ? 's' : '') + '://' + NA.webconfig.urlHostname + ((NA.webconfig.urlPort !== ((NA.webconfig.httpSecure) ? 443 : 80)) ? ':' + NA.webconfig.urlPort : '');
};