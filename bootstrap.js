const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");
Cu.import('resource://gre/modules/osfile.jsm');

var zr = Cc["@mozilla.org/libjar/zip-reader;1"].createInstance(Ci.nsIZipReader);
var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
               createInstance(Components.interfaces.nsIFileOutputStream);
var reusableStreamInstance = Cc['@mozilla.org/scriptableinputstream;1'].createInstance(Ci.nsIScriptableInputStream);

XPCOMUtils.defineLazyModuleGetter(this, "Log",
          "resource://gre/modules/AndroidLog.jsm", "AndroidLog");

let CONTENT_PATH_STR = 'content\/';


// Define the "dump" function as a binding of the Log.d function so it specifies
// the "debug" priority and a log tag.
function dump(msg) {
    Log.d("Browser", msg);
}

function warn(msg) {
    Log.e("Browser", msg);
}

function extractAll(nsiFileXpi, destinationDir) {
    dump('Extracting hyphenation files..');
    try {
      zr.open(nsiFileXpi);
      var entries = zr.findEntries('*.dic');
      while (entries.hasMore()) {
        var entryPointer = entries.getNext();
        var entry = zr.getEntry(entryPointer);
        //dump('entryPointer: ' + entryPointer);

        if (!entry.isDirectory) {
            var outputFilePath = destinationDir.clone();
            outputFilePath.append(getFileName(entryPointer));
            //dump("The outputFilePath after append: " + outputFilePath.path);

            zr.extract(entryPointer, outputFilePath);
        }
      }
    } catch (ex) {
      warn('exception occured = ', ex);
      if (ex.name == 'NS_ERROR_FILE_NOT_FOUND') {
        Services.ww.activeWindow.alert('XPI at path does not exist!\n\nPath = ' + pathToXpiToRead);
      }
    } finally {
      zr.close();
    }
}

function getFileName(path) {
    return path.substring(CONTENT_PATH_STR.length, path.length);
}

function getRootHyphenationPath() {
    var path = Services.dirsvc.get("GreD", Ci.nsIFile);
    path.append("hyphenation");
    return path;
}

function createHyphenDir(dir) {
    try {
        dir.create(Ci.nsIFile.DIRECTORY_TYPE, 0771);
    } catch (ex) {
        if (ex.name == 'NS_ERROR_FILE_ALREADY_EXISTS') {
            dump("\'hyphenation\' nsiFile already exists");
        }
    }

    dump("We are here and this is where we are: " + dir.path);
}

function getExtensionPath() {
    var dir = Services.dirsvc.get("ProfD", Ci.nsIFile);

    if (!dir) {
        dump("Can't find profile directory.");
        return;
    }

    dir.append("extensions");
    dir.append("hyphenation-files@mozilla.org.xpi");

    return dir;
}

function startup(data, reason) {}

function shutdown(data, reason) {}

function install(data, reason) {
    // Move the files to
    let hyphenPath = getRootHyphenationPath();
    if (!hyphenPath.exists()) {
        createHyphenDir(hyphenPath);
    }
    let extPath = getExtensionPath();
    extractAll(extPath, hyphenPath);
}

function uninstall(data, reason) {
    // Remove the files here
    // Find directory, and delete all.
    let path = getRootHyphenationPath();
    path.remove(true);
}
