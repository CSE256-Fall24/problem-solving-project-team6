// Configuration
show_starter_dialogs = false // set this to "false" to disable the survey and 3-minute timer. Set to "true" before submitting to MTurk!!

// ---- Set up main Permissions dialog ----

// Capture the tag parameter from the URL to identify the selected scenario
const urlParams = new URLSearchParams(window.location.search); // Changed to 'urlParams'
const scenarioTag = urlParams.get('tag');

let initialPermissionsData = {}; // Object to hold initial permissions data

// Function to load scenario-specific initial permissions data
function loadInitialPermissions(tag) {
    // Dynamically load the appropriate scenario file based on the tag
    const scenarioFilePath = `./scenario-configs/${tag}.js`;

    $.getScript(scenarioFilePath)
        .done(() => {
            console.log(`Loaded configuration for ${tag}`);

            // Assuming `files` and other permission variables are declared in the scenario file
            if (typeof files !== 'undefined') {
                initialPermissionsData = files.map(file => {
                    return {
                        name: file.name,
                        owner: file.owner,
                        acl: file.acl,
                        inherited: file.using_permission_inheritance,
                        isFolder: file.is_folder
                    };
                });
            }

            console.log("Initial Permissions Data:", initialPermissionsData);
        })
        .fail(() => {
            console.error(`Failed to load configuration for ${tag}`);
        });
}

// Run this function on page load to set up the scenario permissions
$(document).ready(() => {
    if (scenarioTag) {
        loadInitialPermissions(scenarioTag); // Load initial permissions based on the scenario tag
    } else {
        console.error("No scenario tag provided in the URL.");
    }
    //$('#perm_add_user_field').remove();
    $('#perm_add_user_field').css('display', 'none');
});



// --- Create all the elements, and connect them as needed: ---
// Make permissions dialog:
perm_dialog = define_new_dialog('permdialog', title = 'Permissions', options = {
    height: 600,
    width: 600,
    position: {
        my: "left top",  // Align the left side of the dialog with the left side of the screen
        at: "left+20 top+50", // Position it 20px from the left and 50px from the top
        of: window // Set position relative to the window
    },
    buttons: [
        // {
        //     text: "Undo",
        //     id: "perm-dialog-undo-button",
        //     click: function () {
        //         undo();
        //     }
        // },
        {
            text: "Reset",
            id: "perm-dialog-reset-button",
            click: function () {
                reset();
            }
        },
        {
            text: "OK",
            id: "perm-dialog-ok-button",
            click: function () {
                $(this).dialog("close");
            }
        },
        {
            text: "Advanced Permissions",
            id: "perm-dialog-advanced-button",
            click: function () {
                open_advanced_dialog(perm_dialog.attr('filepath'));
            }
        }
    ],
    create: function () {
        //const objectPath = perm_dialog.attr('filepath') || "/default/path";
        //$(this).dialog("option", "title", `Permissions for Object Path: ${objectPath}`);
        // Wrap buttons in left and right containers
        $(this).parent().find('.ui-dialog-buttonpane').wrapInner('<div class="button-container" style="width: 100%; display: flex; justify-content: space-between;"></div>');
        $(this).parent().find('.ui-dialog-buttonpane .button-container').prepend('<div class="left-buttons"></div>');
        $(this).parent().find('.ui-dialog-buttonpane .button-container').append('<div class="right-buttons"></div>');

        // Move the buttons to their respective containers
        $('#perm-dialog-undo-button, #perm-dialog-reset-button').appendTo('.left-buttons');
        $('#perm-dialog-undo-button').remove();
        $('#perm-dialog-ok-button, #perm-dialog-advanced-button').appendTo('.right-buttons');

        // Reapply the blue-button class to ensure the OK button is styled correctly
        $('#perm-dialog-ok-button').addClass('blue-button');
    }
});

// Add CSS for styling
$("<style type='text/css'> \n\
    .blue-button { background-color: #3d7de3; color: white; } \n\
</style>").appendTo("head");



let change_log_div = $(`
    <div id="change_log" class="section">
        <br>
        <hr>
        <h3>Change Log</h3>
        <hr>
        <ul id="change_log_list" style="padding-left: 20px;">
            <style>
                #change_log_list li {
                    margin-bottom: 10px;
                    padding-bottom: 10px;
                    margin-left: 0px;
                    padding-left: 0px;
                    line-height: 1.5;
                }
            </style>
        </ul>
        <p id="no_changes_message">No changes made yet.</p>
        <hr>
        <br>
    </div>
`);

// Make the initial "Object Name:" text:
// If you pass in valid HTML to $(), it will *create* elements instead of selecting them. (You still have to append them, though)

// Create the dropdown for Object Path with a smaller width and adjusted font size for options
// Display the Object Path as static text instead of a dropdown
let objectPathDisplay = $(`
    <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <label for="objectPathDisplay" style="font-weight: bold; margin-right: 5px; font-size: 14px;">Object Path:</label>
        <span id="objectPathDisplay" style="width: 60%; padding: 1px; font-size: 14px;">/C/presentation_documents</span>
    </div>
`);


//Make the div with the explanation about special permissions/advanced settings:
advanced_expl_div = $('<div id="permdialog_advanced_explantion_text" style="margin-top: 15px;"><strong><span style="color: blue; font-size: 20px;">Step 3:</span></strong> For <strong>special permissions (inheritance) </strong> or <strong>advanced settings</strong>, click <strong>Advanced</strong>.</div>');
// Make the (grouped) permission checkboxes table:
grouped_permissions = define_grouped_permission_checkboxes('permdialog_grouped_permissions')
grouped_permissions.addClass('section') // add a 'section' class to the grouped_permissions element. This class adds a bit of spacing between this element and the next.

// Make the list of users (empty for now - will get populated when we know the file):
file_permission_users = define_single_select_list('permdialog_file_user_list', function (selected_user, e, ui) {
    // when a new user is selected, change username attribute of grouped permissions:
    grouped_permissions.attr('username', selected_user)
})
file_permission_users.css({
    'height': '80px',
})


// Create a container div for the Add User button with a specific ID for styling
let perm_add_user_container = $('<div id="perm_add_user_container"></div>');

// Make button to add a new user to the list:
perm_add_user_select = define_new_user_select_field('perm_add_user', 'Add User', on_user_change = function (selected_user) {
    let filepath = perm_dialog.attr('filepath');
    if (selected_user && (selected_user.length > 0) && (selected_user in all_users)) { // sanity check that a user is actually selected (and exists)
        let expected_user_elem_id = `permdialog_file_user_${selected_user}`;
        if (file_permission_users.find(`#${expected_user_elem_id}`).length === 0) { // if such a user element doesn't already exist
            new_user_elem = make_user_elem('permdialog_file_user', selected_user);
            file_permission_users.append(new_user_elem);
        }
    }
});

// Apply inline styling to the Add User button to make it smaller
perm_add_user_select.find('button').css({
    'font-size': '10px',
    'padding': '2px 6px',
    'width': 'auto',
    'height': 'auto',
    'margin': '2px'
});

perm_add_user_container.append(perm_add_user_select);
perm_dialog.append(perm_add_user_container);
// -- Make button to remove currently-selected user; also make some dialogs that may pop up when user clicks this. --

// Make a dialog which shows up when they're not allowed to remove that user from that file (because of inheritance)
cant_remove_dialog = define_new_dialog('cant_remove_inherited_dialog', 'Security', {
    buttons: {
        OK: {
            text: "OK",
            id: "cant-remove-ok-button",
            click: function () {
                $(this).dialog("close");
            }
        }
    }
})
cant_remove_dialog.html(`
<div id="cant_remove_text">
    You can't remove <span id="cant_remove_username_1" class = "cant_remove_username"></span> because this object is inheriting permissions from 
    its parent. To remove <span id="cant_remove_username_2" class = "cant_remove_username"></span>, you must prevent this object from inheriting permissions.
    Turn off the option for inheriting permissions, and then try removing <span id="cant_remove_username_3" class = "cant_remove_username"></span>  again.
</div>`)

// Make a confirmation "are you sure you want to remove?" dialog
// Dialog for confirming removal of permissions for user and file (user and file attributed need to be populated)
let are_you_sure_dialog = define_new_dialog('are_you_sure_dialog', "Are you sure?", {
    buttons: {
        Yes: {
            text: "Yes",
            id: "are-you-sure-yes-button",
            click: function () {
                // Which user and file were they trying to remove permissions for?
                let username = file_permission_users.attr('selected_item')
                let filepath = perm_dialog.attr('filepath')

                // Remove all the permissions:
                remove_all_perms_for_user(path_to_file[filepath], all_users[username])

                // Update the UI to show that it's been removed:
                file_permission_users.find('.ui-selected').remove()
                file_permission_users.unselect() // clear user selection
                let logMessage = `
                    <div>
                        Removed All Permissions for a User/Group on a File/Folder
                        <ul style="padding-left: 20px;">
                            <li><strong>User/Group:</strong> ${username}</li>
                            <li><strong>File/Folder:</strong> ${filepath}</li>
                        </ul>
                    </div>
                `;

                logAction(logMessage);

                // Finally, close this dialog:
                $(this).dialog("close");

            },
        },
        No: {
            text: "No",
            id: "are-you-sure-no-button",
            click: function () {
                $(this).dialog("close");
            }
        }
    }
})
// Add text to the dialog:
are_you_sure_dialog.text('Do you want to remove permissions for this user?')

// Make actual "remove" button:
perm_remove_user_button = $('<button id="perm_remove_user" class="ui-button ui-widget ui-corner-all"> Remove User</button>')
perm_remove_user_button.click(function () {
    // Get the current user and filename we are working with:
    let selected_username = file_permission_users.attr('selected_item')

    // Get the actual element that we want to remove from the user list:
    let selected_user_elem = file_permission_users.find('.ui-selected') // find the element inside file_permission_users that has the special class ui-selected (given by jquery-ui selectable widget)
    let has_inherited_permissions = selected_user_elem.attr('inherited') === "true" // does it have inherited attribute set to "true"?

    // Check whether it's OK to remove it:
    if (has_inherited_permissions) {
        // Not OK -  pop up "can't remove" dialog instead
        $('.cant_remove_username').text(selected_username) // populate ALL the fields with the username
        cant_remove_dialog.dialog('open') // open the dialog
    }
    else {
        // OK to remove - pop up confirmation dialog
        // pass along username and filepath to the dialog, so that it knows what to remove if they click "Yes"
        are_you_sure_dialog.dialog('open') // Open the "are you sure" dialog
    }
})


// --- Append all the elements to the permissions dialog in the right order: --- 
//perm_dialog.append(change_log_div)
//perm_dialog.append(obj_name_div)
perm_dialog.prepend(objectPathDisplay);
perm_dialog.append($('<div id="permissions_intro"><strong>Here are the steps for changing this file\'s permissions:</strong></div>'));

// Create a flex container for Step 1 text and buttons
let step1Container = $('<div id="step1Container" style="display: flex; align-items: center; justify-content: space-between; width: 100%; margin-bottom: 10px;"></div>');

// Create the "Step 1" and "Select a user..." text
let step1Text = $('<div><strong><span style="color: blue; font-size: 20px;">Step 1:</span></strong> Select a user or group name to view permissions <strong>(group permissions for a file override the individuals permissions)</strong>:</div>');

// Create a container for the buttons with smaller size
let buttonContainer = $('<div style="display: flex; gap: .5px;"></div>');

// Create "Add User" and "Remove User" buttons with specific styling
let addUserButton = perm_add_user_select.find('button').css({
    'font-size': '10px',
    'padding': '2px 6px',
    'width': 'auto',
    'height': 'auto'
});

let removeUserButton = perm_remove_user_button.css({
    'font-size': '10px',
    'padding': '2px 6px',
    'width': 'auto',
    'height': 'auto'
});

// Append both buttons to the button container
buttonContainer.append(addUserButton);
buttonContainer.append(removeUserButton);

// Append text and button container to step1Container
step1Container.append(step1Text);
step1Container.append(buttonContainer);

// Append the entire step1Container to the permissions dialog
perm_dialog.append(step1Container);

// Append remaining elements to the dialog
perm_dialog.append(file_permission_users);

let step2Text = $(`
    <div style="margin-top: 10px;">
        <strong><span style="color: blue; font-size: 20px;">Step 2:</span></strong> Set permissions for the selected user or group:
        <div style="font-size: 15px; color: #FF0000; margin-top: 5px;"> <strong> Note: Deny overwrites Allow permissions.</strong> </div>
    </div>
`);
perm_dialog.append(step2Text); // Append Step 2 description and note

perm_dialog.append(grouped_permissions);
perm_dialog.append(advanced_expl_div);
perm_dialog.append(change_log_div);

// --- Additional logic for reloading contents when needed: ---
//Define an observer which will propagate perm_dialog's filepath attribute to all the relevant elements, whenever it changes:
define_attribute_observer(perm_dialog, 'filepath', function () {
    let current_filepath = perm_dialog.attr('filepath')

    grouped_permissions.attr('filepath', current_filepath) // set filepath for permission checkboxes
    $('#permdialog_objname_namespan').text(current_filepath) // set filepath for Object Name text

    // Generate element with all the file-specific users:
    file_users = get_file_users(path_to_file[current_filepath])
    file_user_list = make_user_list('permdialog_file_user', file_users, add_attributes = true)
    grouped_permissions.attr('username', '') // since we are reloading the user list, reset the username in permission checkboxes
    //replace previous user list with the one we just generated:
    file_permission_users.empty()
    file_permission_users.append(file_user_list)
})



// ---- Old code which doesn't use the helper functions starts here ----


// Make (semi-generic) selectable list of elements for all users.
// attr_set_id is the id of the element where we should store the currently selected username.
function make_all_users_list(id_prefix, attr_set_id, height = 80) {
    let all_user_list = $(`<div id="${id_prefix}_all_users" class="selectlist section" style="height:${height}px;overflow-y:scroll"></div>`)
    for (let username in all_users) {
        let user = all_users[username]
        all_user_list.append(
            `<div class="ui-widget-content" id="${id_prefix}_${username}" username="${username}">
                <span id="${id_prefix}_${username}_icon" class="oi ${is_user(user) ? 'oi-person' : 'oi-people'}"/> 
                ${username}
            </div>`)
    }

    all_user_list.selectable({
        selected: function (e, ui) {
            // Unselect any previously selected (normally, selectable allows multiple selections)
            $(ui.selected).addClass("ui-selected").siblings().removeClass("ui-selected");

            $(`#${attr_set_id}`).attr('username', ui.selected.getAttribute('username'))

            emitter.dispatchEvent(new CustomEvent('userEvent', { detail: new ClickEntry(ActionEnum.CLICK, (e.clientX + window.pageXOffset), (e.clientY + window.pageYOffset), 'user dialog: select user ' + ui.selected.getAttribute('username'), new Date().getTime()) }))


        }
    })

    return all_user_list
}

// populate and open the "permissions entry" dialog for a given file
function open_permission_entry(file_path) {
    let file_obj = path_to_file[file_path]

    $('#perm_entry_username').text('')

    $('.perm_entry_checkcell').empty()

    $(`#permentry`).dialog('open')
}

// populate and open the "advanced" dialog for a given file
function open_advanced_dialog(file_path) {
    let file_obj = path_to_file[file_path]

    // set file path in UI:
    $('#adv_perm_filepath').text(file_path);
    $('#adv_owner_filepath').text(file_path);
    $('#adv_effective_filepath').text(file_path);
    $('#advdialog').attr('filepath', file_path);

    // clear dynamic content:
    $('#adv_perm_table tr:gt(0)').remove()
    $('#adv_owner_user_list').empty()
    $(`.effectivecheckcell`).empty()

    if (file_obj.using_permission_inheritance) {
        $('#adv_perm_inheritance').prop('checked', true)
    }
    else {
        $('#adv_perm_inheritance').prop('checked', false)
    }



    // permissions list for permissions tab:
    let users = get_file_users(file_obj)
    for (let u in users) {
        let grouped_perms = get_grouped_permissions(file_obj, u)
        for (let ace_type in grouped_perms) {
            for (let perm in grouped_perms[ace_type]) {
                $('#adv_perm_table').append(`<tr id="adv_perm_${file_obj.filename}__${u}_${ace_type}_${perm}">
                    <td id="adv_perm_${file_obj.filename}__${u}_${ace_type}_${perm}_type">${ace_type}</td>
                    <td id="adv_perm_${file_obj.filename}__${u}_${ace_type}_${perm}_name">${u}</td>
                    <td id="adv_perm_${file_obj.filename}__${u}_${ace_type}_${perm}_permission">${perm}</td>
                    <td id="adv_perm_${file_obj.filename}__${u}_${ace_type}_${perm}_type">${grouped_perms[ace_type][perm].inherited ? "Parent Object" : "(not inherited)"}</td>
                </tr>`)
            }
        }
    }

    // user list for owner tab:
    let all_user_list = make_all_users_list('adv_owner_', 'adv_owner_current_owner')

    $('#adv_owner_current_owner').text(get_user_name(file_obj.owner))

    $('#adv_owner_user_list').append(all_user_list)

    // open dialog:
    $(`#advdialog`).dialog('open')
}

// Update Effective User display
function update_effective_user() {
    $('.effectivecheckcell').empty()
    let selected_username = $('#adv_effective_current_user').attr('selected_user')

    // if a user is actually selected (and is in the user list):
    if (selected_username && (selected_username.length > 0) && (selected_username in all_users)) {
        let selected_user = all_users[selected_username]

        let filepath = $('#advdialog').attr('filepath')
        let file = path_to_file[filepath]

        // for each possible permission value
        for (let p of Object.values(permissions)) {
            // if the actual model would allow an action with permission
            if (allow_user_action(file, selected_user, p)) {
                // find the checkbox cell and put a checkbox there.
                $(document.getElementById(`adv_effective_checkcell_${p}`)).append(`<span id="adv_effective_checkbox_${p}" class="oi oi-check"/>`)
            }
        }
    }

}

// TODO: redo everything to use the new user_select_dialog
function open_user_select(to_populate) {
    $('#user_select_dialog').attr('to_populate', to_populate)

    $('#user_select_container').empty()
    user_select_list = make_all_users_list('user_select', 'user_select_dialog', 200)
    $('#user_select_container').append(user_select_list)

    $(`#user_select_dialog`).dialog('open')
}

// set up effective permissions table in advanced -> effective dialog
for (let p of Object.values(permissions)) {
    let row = $(`
    <tr id="adv_effective_row_${p}">
        <td id="adv_effective_checkcell_${p}"class="effectivecheckcell"></td>
        <td id="adv_effective_name_${p}">${p}</td>
    </tr>
    `)
    $('#adv_effective_effective_list').append(row)
}

// Advanced dialog
$("#advtabs").tabs({
    heightStyle: 'fill'
});
let adv_contents = $(`#advdialog`).dialog({
    position: { my: "top", at: "top", of: $('#html-loc') },
    width: 700,
    height: 450,
    modal: true,
    autoOpen: false,
    appendTo: "#html-loc",
    buttons: {
        OK: {
            text: "OK",
            id: "advanced-dialog-ok-button",
            click: function () {
                $(this).dialog("close");
            }
        }
    }
});
// generate ID for each HTML element making up the dialog:

// open user select dialog on "select" button press:
$("#adv_effective_user_select").click(function (event) {
    open_user_select("adv_effective_current_user") // Update element with id=adv_effective_current_user once user is selected.
})

// listen for changes to inheritance checkbox:
$('#adv_perm_inheritance').change(function () {
    let filepath = $('#advdialog').attr('filepath')
    let file_obj = path_to_file[filepath]
    if ($('#adv_perm_inheritance').prop('checked')) {
        // has just been turned on
        file_obj.using_permission_inheritance = true
        emitState()
        open_advanced_dialog(filepath) // reload/reopen dialog
        perm_dialog.attr('filepath', filepath) // force reload 'permissions' dialog
    }
    else {
        // has just been turned off - pop up dialog with add/remove/cancel
        $(`<div id="add_remove_cancel" title="Security">
            Warning: if you proceed, inheritable permissions will no longer propagate to this object.<br/>
            - Click Add to convert and add inherited parent permissions as explicit permissions on this object<br/>
            - Click Remove to remove inherited parent permissions from this object<br/>
            - Click Cancel if you do not want to modify inheritance settings at this time.<br/>
        </div>`).dialog({ // TODO: don't create this dialog on the fly
            modal: true,
            width: 400,
            appendTo: "#html-loc",
            position: { my: "top", at: "top", of: $('#html-loc') },
            buttons: {
                Add: {
                    text: "Add",
                    id: "adv-inheritance-add-button",
                    click: function () {
                        let filepath = $('#advdialog').attr('filepath')
                        let file_obj = path_to_file[filepath]
                        convert_parent_permissions(file_obj)
                        open_advanced_dialog(filepath) // reload/reopen 'advanced' dialog
                        perm_dialog.attr('filepath', filepath) // force reload 'permissions' dialog
                        $(this).dialog("close");
                    },
                },
                Remove: {
                    text: "Remove",
                    id: "adv-inheritance-remove-button",
                    click: function () {
                        let filepath = $('#advdialog').attr('filepath')
                        let file_obj = path_to_file[filepath]
                        file_obj.using_permission_inheritance = false
                        emitState()
                        open_advanced_dialog(filepath) // reload/reopen 'advanced' dialog
                        perm_dialog.attr('filepath', filepath) // force reload 'permissions' dialog
                        $(this).dialog("close");
                    },
                },
                Cancel: {
                    text: "Cancel",
                    id: "adv-inheritance-cancel-button",
                    click: function () {
                        $('#adv_perm_inheritance').prop('checked', true) // undo unchecking
                        $(this).dialog("close");
                    },
                },
            }
        })
    }
})




// listen for changes to "replace..." checkbox:
$('#adv_perm_replace_child_permissions').change(function () {
    if ($('#adv_perm_replace_child_permissions').prop('checked')) {
        // we only care when it's been checked (nothing happens on uncheck) (this should really not be a checkbox...)
        let filepath = $('#advdialog').attr('filepath')
        let file_obj = path_to_file[filepath]
        $(`<div id="replace_perm_dialog" title="Security">
            This will replace explicitly defined permissions on all descendants of this object with inheritable permissions from ${file_obj.filename}.<br/>
            Do you wish to continue?
        </div>`).dialog({
            modal: true,
            position: { my: "top", at: "top", of: $('#html-loc') },
            width: 400,
            buttons: {
                Yes: {
                    text: "Yes",
                    id: "adv-replace-yes-button",
                    click: function () {
                        let filepath = $('#advdialog').attr('filepath')
                        let file_obj = path_to_file[filepath]
                        replace_child_perm_with_inherited(file_obj)
                        open_advanced_dialog(filepath) // reload/reopen 'advanced' dialog
                        perm_dialog.attr('filepath', filepath) // reload contents of permissions dialog
                        $(this).dialog("close");
                    },
                },
                No: {
                    text: "No",
                    id: "adv-replace-no-button",
                    click: function () {
                        $('#adv_perm_replace_child_permissions').prop('checked', false) // undo checking
                        $(this).dialog("close");
                    },
                },
            }
        })
    }
})

// listen for mutations on selected user name in effective user permissions:
effective_user_observer = new MutationObserver(function (mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'attributes') {
            if (mutation.attributeName === 'selected_user') {
                update_effective_user()
            }
        }
    }
})

effective_user_observer.observe(document.getElementById('adv_effective_current_user'), { attributes: true })

// change owner button:
$('#adv_owner_change_button').click(function () {
    let selected_username = $('#adv_owner_current_owner').attr('username')
    let filepath = $('#advdialog').attr('filepath')
    let file_obj = path_to_file[filepath]
    if (selected_username && (selected_username.length > 0) && (selected_username in all_users)) {
        file_obj.owner = all_users[selected_username]
        $('#adv_owner_current_owner').text(selected_username)
        emitState() // Log new state
    }
})



// User dialog 
let user_select_contents = $("#user_select_dialog").dialog({
    height: 450,
    width: 400,
    modal: true,
    autoOpen: false,
    appendTo: "#html-loc",
    position: { my: "top", at: "top", of: $('#html-loc') },
    buttons: {
        Cancel: {
            text: "Cancel",
            id: "user-select-cancel-button",
            click: function () {
                $(this).dialog("close");
            },
        },
        OK: {
            text: "OK",
            id: "user-select-ok-button",
            click: function () {
                // populate field with user name (assume these are stored in attributes)
                let to_populate_id = $(this).attr('to_populate')
                let selected_value = $(this).attr('username')
                $(`#${to_populate_id}`).text(selected_value)
                $(`#${to_populate_id}`).attr('selected_user', selected_value)
                $(this).dialog("close");
            }
        }
    }
})



let perm_entry_dialog = $('#permentry').dialog({
    modal: true,
    autoOpen: false,
    height: 500,
    width: 400,
    appendTo: "#html-loc",
    position: { my: "top", at: "top", of: $('#html-loc') },
    buttons: {
        OK: {
            text: "OK",
            id: "permission-entry-ok-button",
            click: function () {
                open_advanced_dialog($('#advdialog').attr('filepath'))// redo advanced dialog (recalc permissions)
                perm_dialog.attr('filepath', filepath) // reload contents of permissions dialog
                $(this).dialog("close");
            }
        }
    }
})

for (let p of Object.values(permissions)) {
    let row = $(`<tr id="perm_entry_row_${p}">
        <td id="perm_entry_row_${p}_cell">${p}</td>
    </tr>`)
    for (let ace_type of ['allow', 'deny']) {
        row.append(`<td id="perm_entry_row_${p}_${ace_type}" class="perm_entry_checkcell" perm="${p}" type="${ace_type}"></td>`)
    }
    $('#perm_entry_table').append(row)
}

$('#adv_perm_edit').click(function () {
    let filepath = $('#advdialog').attr('filepath')
    open_permission_entry(filepath)
})

$('#perm_entry_change_user').click(function () {
    open_user_select('perm_entry_username')
})


perm_entry_user_observer = new MutationObserver(function (mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'attributes') {
            if (mutation.attributeName === 'selected_user') {

                let filepath = $('#advdialog').attr('filepath') // TODO: maybe set and use own filepath in this dialog.
                let file_obj = path_to_file[filepath]

                // get rid of previous checkboxes:
                $('.perm_entry_checkcell').empty()
                // by default, put unchecked checkboxes everywhere:
                $('.perm_entry_checkcell').each(function (i) {
                    let cell_id = $(this).attr('id')
                    let checkbox = $(`<input type="checkbox" id="${cell_id}_checkbox" class="perm_entry_checkbox"></input>`)
                    $(this).append(checkbox)
                })

                let all_perms = get_total_permissions(file_obj, $('#perm_entry_username').attr('selected_user'))
                for (let ace_type in all_perms) {
                    for (let p in all_perms[ace_type]) {
                        let checkbox = $(document.getElementById(`perm_entry_row_${p}_${ace_type}_checkbox`))
                        checkbox.prop('checked', true)
                        if (all_perms[ace_type][p].inherited) {
                            // can't uncheck inherited permissions.
                            checkbox.prop('disabled', true)
                        }
                    }
                }

                $('.perm_entry_checkbox').change(function () {
                    let username = $('#perm_entry_username').attr('selected_user')
                    let filepath = $(`#advdialog`).attr('filepath')
                    toggle_permission(filepath, username, $(this).parent().attr('perm'), $(this).parent().attr('type'), $(this).prop('checked'))
                })
            }
        }
    }
})

perm_entry_user_observer.observe(document.getElementById('perm_entry_username'), { attributes: true })



// --- add pre- and post- dialogs ---



function end_task() {
    $('#html-loc').empty()
    $(`<div id="end_dialog" title="Task Ended">The time allotted for this task has run out. Please select one of the options in the collapsible task panel below to submit the task.</div>`)
        .dialog({
            width: 400,
            height: 200,
            appendTo: "#html-loc",
            dialogClass: "no-close",
            position: { my: "top", at: "top", of: $('#html-loc') },
        })
}


$(`<div id="start-dialog" title = "Description">
In a moment, you will see a simplified file system management interface and a task.
Pretend that you are an administrator for this file system, and you are tasked with maintaining correct file permissions.
<br/><br/>
You will have 3 minutes to attempt the task described in the task panel at the bottom of the page. (Note: the task panel is collapsible; if it blocks the interface, use the bottom-right button to collapse it.)
<br/><br/>
After 3 minutes, the interface will be disabled and you will submit an answer to a single question about how far you got with the task. 
If you complete the task early, you will also be able to submit the answer as soon as you are done.
<br/><br/>
<b style="color:red">In order to get your HIT approved, You MUST use the file interface to try to complete the given task.</b> 
You will still get paid if you don't finish the task, but you have to try.
</div>`).dialog({
    modal: true,
    width: 700,
    //height: 350,
    appendTo: "#html-loc",
    dialogClass: "no-close",
    autoOpen: show_starter_dialogs,
    close: function (event, ui) {
        window.setTimeout(end_task, 3 * 60 * 1000)
    },
    buttons: {
        OK: {
            text: "OK",
            id: "start-dialog-ok-button",
            click: function () {
                $(this).dialog("close");
                emitState("Initial permission state");
                $('#mturk-top-banner-collapse-button').click()
            }
        }
    }
})

$(`<div id="survey-dialog" title="Survey">
    <div id="survey-explanation" style="section">Before you begin the task, please indicate how much you agree or disagree with each of the following statements:</div>
    <form id="survey-form">
    <br/>

    <div id="motivation1_question">I enjoy piloting/beta-testing next-generation technology</div>
    <label id="motivation1_a0_label"><input id="motivation1_a0" type="radio" name="motivation1" value="0" required> Strongly Disagree</label>
    <label id="motivation1_a1_label"><input id="motivation1_a1" type="radio" name="motivation1" value="1" required> Disagree</label>
    <label id="motivation1_a2_label"><input id="motivation1_a2" type="radio" name="motivation1" value="2" required> Neither Agree nor Disagree</label>
    <label id="motivation1_a3_label"><input id="motivation1_a3" type="radio" name="motivation1" value="3" required> Agree</label>
    <label id="motivation1_a4_label"><input id="motivation1_a4" type="radio" name="motivation1" value="4" required> Strongly Agree</label>
    <br/>
    <br/>

    <div id="motivation2_question">I only learn the technology I have to know to get my work done</div>
    <label id="motivation2_a0_label"><input id="motivation2_a0" type="radio" name="motivation2" value="0" required> Strongly Disagree</label>
    <label id="motivation2_a1_label"><input id="motivation2_a1" type="radio" name="motivation2" value="1" required> Disagree</label>
    <label id="motivation2_a2_label"><input id="motivation2_a2" type="radio" name="motivation2" value="2" required> Neither Agree nor Disagree</label>
    <label id="motivation2_a3_label"><input id="motivation2_a3" type="radio" name="motivation2" value="3" required> Agree</label>
    <label id="motivation2_a4_label"><input id="motivation2_a4" type="radio" name="motivation2" value="4" required> Strongly Agree</label>
    <br/>
    <br/>

    <div id="info_proc_question">When problem-solving, I prefer to collect as much information as possible before making any changes</div>
    <label id="info_proc_a0_label"><input id="info_proc_a0" type="radio" name="info_proc" value="0" required> Strongly Disagree</label>
    <label id="info_proc_a1_label"><input id="info_proc_a1" type="radio" name="info_proc" value="1" required> Disagree</label>
    <label id="info_proc_a2_label"><input id="info_proc_a2" type="radio" name="info_proc" value="2" required> Neither Agree nor Disagree</label>
    <label id="info_proc_a3_label"><input id="info_proc_a3" type="radio" name="info_proc" value="3" required> Agree</label>
    <label id="info_proc_a4_label"><input id="info_proc_a4" type="radio" name="info_proc" value="4" required> Strongly Agree</label>
    <br/>
    <br/>

    <div id="efficacy_question">If I encounter a problem with computer software, I am confident I would be able to fix it</div>
    <label id="efficacy_a0_label"><input id="efficacy_a0" type="radio" name="efficacy" value="0" required> Strongly Disagree</label>
    <label id="efficacy_a1_label"><input id="efficacy_a1" type="radio" name="efficacy" value="1" required> Disagree</label>
    <label id="efficacy_a2_label"><input id="efficacy_a2" type="radio" name="efficacy" value="2" required> Neither Agree nor Disagree</label>
    <label id="efficacy_a3_label"><input id="efficacy_a3" type="radio" name="efficacy" value="3" required> Agree</label>
    <label id="efficacy_a4_label"><input id="efficacy_a4" type="radio" name="efficacy" value="4" required> Strongly Agree</label>
    <br/>
    <br/>

    <div id="risk_question">When given a choice, I will usually pick the lower-risk option, even if it has a lower reward</div>
    <label id="risk_a0_label"><input id="risk_a0" type="radio" name="risk" value="0" required> Strongly Disagree</label>
    <label id="risk_a1_label"><input id="risk_a1" type="radio" name="risk" value="1" required> Disagree</label>
    <label id="risk_a2_label"><input id="risk_a2" type="radio" name="risk" value="2" required> Neither Agree nor Disagree</label>
    <label id="risk_a3_label"><input id="risk_a3" type="radio" name="risk" value="3" required> Agree</label>
    <label id="risk_a4_label"><input id="risk_a4" type="radio" name="risk" value="4" required> Strongly Agree</label>
    <br/>
    <br/>

    <div id="tinkering_question">When using new software, I like to experiment and tinker with the available features</div>
    <label id="tinkering_a0_label"><input id="tinkering_a0" type="radio" name="tinkering" value="0" required> Strongly Disagree</label>
    <label id="tinkering_a1_label"><input id="tinkering_a1" type="radio" name="tinkering" value="1" required> Disagree</label>
    <label id="tinkering_a2_label"><input id="tinkering_a2" type="radio" name="tinkering" value="2" required> Neither Agree nor Disagree</label>
    <label id="tinkering_a3_label"><input id="tinkering_a3" type="radio" name="tinkering" value="3" required> Agree</label>
    <label id="tinkering_a4_label"><input id="tinkering_a4" type="radio" name="tinkering" value="4" required> Strongly Agree</label>
    <br/>
    <br/>

    <button id="submit-survey" class="ui-button ui-widget ui-corner-all" type="submit">
        Submit
    </button>
    </form>
</div>`).dialog({
    modal: true,
    width: 700,
    height: 500,
    autoOpen: show_starter_dialogs,
    appendTo: "#html-loc",
    dialogClass: "no-close",
    closeOnEscape: false
})

$('#survey-form').submit(function () {
    $('#survey-dialog').dialog("close");
    event.preventDefault();
})

// $(document).ready(function () {
//     $('#permdialog_grouped_permissions_Read_name').attr('title', 'Allows the user access to view the files contents');
//     $('#permdialog_grouped_permissions_Write_name').attr('title', 'Allows the user to change the contents of the file');
//     $('#permdialog_grouped_permissions_Read_Execute_name').attr('title', 'Allows the user access to view and execute the file');
//     $('#permdialog_grouped_permissions_Modify_name').attr('title', 'Allows the user to change the file')
//     $('#permdialog_grouped_permissions_Full_control_name').attr('title', 'Allows the user full control to the entire file')

//     $(document).tooltip();

// });
