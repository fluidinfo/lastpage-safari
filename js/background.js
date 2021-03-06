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
        alert("You don't seem to be logged in. Please login via our " +
              "preference pane in Safari.");
        return;
    }

    if (!safari.extension.settings.valid) {
        console.log("ERROR: invalid credentials provided.");
        alert("You seem to have provided an invalid username or password. " +
              "Please enter the correct username and password via our preference " +
              "pane in Safari.");
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

    var clear = function(onSuccess) {
        fi.delete({where: "has " + tag_name,
                   tags: [tag_name],
                   onSuccess: onSuccess,
                   onError: function(response) {
                       // a 404 in this case probably means the tag
                       // doesn't exist so we should just create it
                       if (response.status == 404 && onSuccess != null)
                           onSuccess(response);
                       console.log(response);
                   }
                  });
    };

    var save = function(url) {
        // js gives timestamp in ms, we want seconds
        var unix_time = Math.round(Date.now() / 1000);
        fi.api.put({path: ["about", url, tag_name],
                    data: unix_time,
                    onSuccess: function(response) {
                        console.log(response);
                    },
                    onError: function(response) {
                        console.log(response);
                    }
                   });
    };

    if (event.command === "save-location") {
        var url = safari.application.activeBrowserWindow.activeTab.url;
        var redirect = "http://lastpage.me/" + username;
        if (event.suffix)
            redirect += "/" + suffix;
        // delete the old location
        clear(function(response) {
          console.log(response);
          // save the new location
          save(url);
        });
    } else if (event.command === "clear-location") {
        clear(function(response) { console.log(response); });
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

function validateCredentials(event) {
    if (event.key == "username" || event.key == "password") {
        var username = safari.extension.secureSettings.username;
        var password = safari.extension.secureSettings.password;
        var fi = fluidinfo({username: username,
                            password: password});
        fi.api.get({path: ["users", username],
                    onSuccess: function(response) {
                        safari.extension.settings.valid = true;
                    },
                    onError: function(response) {
                        safari.extension.settings.valid = false;
                    }
                   });
    }
}

// register handlers with application
safari.application.addEventListener("command", performCommand, false);
safari.application.addEventListener("popover", popoverHandler, true);
safari.application.addEventListener("validate", validateCommand, false);
safari.extension.secureSettings.addEventListener("change", validateCredentials, false);
