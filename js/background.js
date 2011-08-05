function performCommand(event) {
    console.log(event);
    var username = safari.extension.secureSettings.username;
    var password = safari.extension.secureSettings.password;

    if (username && password) {
        fi = fluidinfo({ username: username,
                         password: password
                       });
    } else {
        console.log("ERROR: username or password not found.");
        // safari.extension.popovers[0].show();
        return;
    }

    if (event.suffix) {
        var suffix = event.suffix;
        if (suffix.match(/^[\w\d\.\-\:\/]+$/))
            var tag_name = username + "/lastpage-" + suffix.replace(/\//g, "-");
        else
            alert(suffix + " is an invalid tag. Please only use letters, digits, " +
                  "periods, hyphens, and slashes.");
    } else {
        var tag_name = username + "/lastpage";
    }

    var clear = function() {
        fi.delete({where: "has " + tag_name,
                   tags: tag_name,
                   onSuccess: function(response) {
                       console.log("delete successful");
                       console.log(response);
                   },
                   onError: function(response) {
                       console.log("delete unsuccessful");
                       console.log(response);
                   },
                   async: false
                  });
    };

    var save = function(url) {
        // js gives timestamp in ms, we want seconds
        var unix_time = Math.round(Date.now() / 1000);
        fi.api.put({path: ["about", url, tag_name],
                    data: unix_time,
                    onSuccess: function(response) {
                        console.log("tag successful");
                        console.log(response);
                    },
                    onError: function(response) {
                        console.log("tag unsuccessful");
                        console.log(response);
                    },
                    async: false
                   });
    };

    if (event.command === "save-location") {
        // delete the old location
        clear();
        // save the new location
        var url = safari.application.activeBrowserWindow.activeTab.url;
        var redirect = "http://lastpage.me/" + username;
        if (event.suffix)
            redirect += "/" + suffix;
        save(url);
        copy(redirect);
        console.log("New URL saved.");
    } else if (event.command === "clear-location") {
        clear();
        console.log("Old URL cleared.");
    }
}

function validateCommand(event) {
    if (event.command === "save-location") {
        // disable the button if there is no URL loaded in the tab.
        event.target.disabled = !event.target.browserWindow.activeTab.url;
    }
}

function popoverHandler(event) {
    if (event.target.identifier !== "lastpagePopover") return;
    safari.extension.popovers[0].contentWindow.location.reload();
}
safari.application.addEventListener("popover", popoverHandler, true);

function notify(redirect) {
    // only want to do this once...
    if (!localStorage.notified) {
        var notification = webkitNotifications.createNotification(
            '../icon-48px.png',
            'Congratulations!',
            "We've recorded your current web location. To bring a friend " +
                "to this page, tell them to visit "+ redirect + ". " +
                "To make it easier to pass along, we've also " +
                "copied " + redirect + " to your clipboard."
        )
        notification.show();
        localStorage.notified = true;
    }
}

function copy(text) {
    input = document.getElementById("copy");
    input.value = text;
    input.focus();
    input.select();
    document.execCommand("Copy");
}

// register handlers with application
safari.application.addEventListener("command", performCommand, false);
safari.application.addEventListener("validate", validateCommand, false);


// // initialize the popup or browser action depending on settings
// chrome.browserAction.onClicked.addListener(
//     function(tab) {
//         chrome.tabs.executeScript(tab.id,
//                                   {code: 
//                                    'chrome.extension.sendRequest(' +
//                                    '{action: "saveLocation"},' +
//                                    'function(response) {' +
//                                    'console.log(response);' +
//                                    '});'}
//                                  );
//     }
// );

// if (safari.extension.settings.advanced === true ||
//     !(safari.extension.secureSettings.username &&
//       safari.extension.secureSettings.password)) {
//     // show the popover if user is not logged in or has chosen advanced
//     // mode
//     safari.extension.toolbarItems[0].popover = safari.extension.popovers[0];
// }
// function popoverHandler(event) {
//     if (event.target.identifier !== "lastpagePopover") return;
//     if (safari.extension.settings.advanced === false &&
//         safari.extension.secureSettings.username &&
//         safari.extension.secureSettings.password) {
//         // user is logged in and does not want advanced mode
//         // save();
//         event.preventDefault();
//         event.stopPropagation();
//     }
// }
// safari.application.addEventListener("popover", popoverHandler,
// true);
