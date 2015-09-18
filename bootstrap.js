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

// Define the "dump" function as a binding of the Log.d function so it specifies
// the "debug" priority and a log tag.
function dump(msg) {
  Log.d("Browser", msg);
}

function readAllXPIContents(nsiFileXpi) {
    try {
      zr.open(nsiFileXpi);
      var entries = zr.findEntries('*.dic');
      while (entries.hasMore()) {
        var entryPointer = entries.getNext();
        var entry = zr.getEntry(entryPointer);
        dump('entryPointer: ' + entryPointer);

        if (!entry.isDirectory) {
            var outputFilePath = rootDir.clone();
            dump("The outputFilePath before append: " + outputFilePath.path);
            outputFilePath.append(getFileName(entryPointer));
            dump("The outputFilePath after append: " + outputFilePath.path);

            zr.extract(entryPointer, outputFilePath);
        } else {
            dump('is directory, no stream to read');
        }
      }
    } catch (ex) {
      console.warn('exception occured = ', ex);
      if (ex.name == 'NS_ERROR_FILE_NOT_FOUND') {
        Services.ww.activeWindow.alert('XPI at path does not exist!\n\nPath = ' + pathToXpiToRead);
      }
    } finally {
      zr.close();
    }
}

let CONTENT_PATH_STR = 'content\/';

function getFileName(path) {
    return path.substring(CONTENT_PATH_STR.length, path.length);
}
var rootDir;
let HyphenationFiles = {
    classDescription: "An addon with all the hyphenation files to be installed in Fennec",
    classId: Components.ID("{ed3b8fe0-5197-11e5-98bc-61114d5cf93c}"),

    init: function() {
        rootDir = Services.dirsvc.get("GreD", Ci.nsIFile);
        rootDir.append("hyphenation");
        try {
            rootDir.create(Ci.nsIFile.DIRECTORY_TYPE, 0666);
        } catch (ex) {
            if (ex.name == 'NS_ERROR_FILE_ALREADY_EXISTS') {
                dump("RootDir: \'hyphenation\' directory already exists");
            }
        }

        var rootStr = "RootDir: ";
        if (rootDir.isDirectory()) {
            rootStr += "This is a directory";
        } else if (rootDir.isFile()) {
            rootStr += "This is a file";
        } else {
            rootStr += "This is not a file or directory..";
        }
        dump(rootStr);

        dump("1.3");
        dump("We are here and this is where we are: " + rootDir.path);


        var chromeDir = Services.dirsvc.get("ProfD", Ci.nsIFile);

        if (chromeDir) {
            dump("We want to write into this directory: " + chromeDir.path);

            if (chromeDir.isDirectory()) {
                dump("This is a directory");
            } else if (chromeDir.isFile()) {
                dump("This is a file");
            } else {
                dump("This is not a file or directory..");
            }

            chromeDir.append("extensions");
            chromeDir.append("hyphenation-files@mozilla.org.xpi");

            if (chromeDir.isDirectory()) {
                dump("This is a directory");
            } else if (chromeDir.isFile()) {
                dump("This is a file");
            } else {
                dump("This is not a file or directory..");
            }

            readAllXPIContents(chromeDir);
        }
    }

    uninit: function() {
        // Remove everything in `hyphenation/`
    }
};

function startup(data, reason) {}

function shutdown(data, reason) {}

function install(data, reason) {
    // Move the files to
    HyphenationFiles.init();
}

function uninstall(data, reason) {
    // Remove the files here
    // Find directory, and delete all.
}
