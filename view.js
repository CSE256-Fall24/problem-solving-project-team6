// ---- Define your dialogs  and panels here ----



// ---- Display file structure ----

// (recursively) makes and returns an html element (wrapped in a jquery object) for a given file object
function make_file_element(file_obj) {
    let file_hash = get_full_path(file_obj);

    if(file_obj.is_folder) {
        let folder_elem = $(`<div class='folder' id="${file_hash}_div">
            <h3 id="${file_hash}_header">
                <span class="oi oi-folder" id="${file_hash}_icon"/> ${file_obj.filename} 
                <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton" title="Update Permissions"> 
                    <span class="oi oi-cog" id="${file_hash}_permicon"/> 
                </button>
            </h3>
        </div>`);
        
        // append children, if any:
        if( file_hash in parent_to_children) {
            let container_elem = $("<div class='folder_contents'></div>");
            folder_elem.append(container_elem);
            for(let child_file of parent_to_children[file_hash]) {
                let child_elem = make_file_element(child_file);
                container_elem.append(child_elem);
            }
        }
        return folder_elem;
    }
    else {
        return $(`<div class='file' id="${file_hash}_div">
            <span class="oi oi-file" id="${file_hash}_icon"/> ${file_obj.filename}
            <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton" title="Update Permissions"> 
                <span class="oi oi-cog" id="${file_hash}_permicon"/> 
            </button>
        </div>`);
    }
}


for(let root_file of root_files) {
    let file_elem = make_file_element(root_file)
    $( "#filestructure" ).append( file_elem);    
}

// make folder hierarchy into an accordion structure
$('.folder').accordion({
    collapsible: true,
    heightStyle: 'content'
}) // TODO: start collapsed and check whether read permission exists before expanding?


// -- Connect File Structure lock buttons to the permission dialog --

// open permissions dialog when a permission button is clicked
$('.permbutton').click( function( e ) {
    // Set the path and open dialog:
    let path = e.currentTarget.getAttribute('path');
    perm_dialog.attr('filepath', path)
    perm_dialog.dialog('open')
    //open_permissions_dialog(path)

    // Deal with the fact that folders try to collapse/expand when you click on their permissions button:
    e.stopPropagation() // don't propagate button click to element underneath it (e.g. folder accordion)
    // Emit a click for logging purposes:
    emitter.dispatchEvent(new CustomEvent('userEvent', { detail: new ClickEntry(ActionEnum.CLICK, (e.clientX + window.pageXOffset), (e.clientY + window.pageYOffset), e.target.id,new Date().getTime()) }))
});

//CASCADING SELECTION
$(document).ready(function() {
    // Cascading selection logic for permissions
    $('#read_execute_checkbox').change(function() {
        if (this.checked) {
            $('#read_checkbox').prop('checked', true);
        }
    });

    $('#modify_checkbox').change(function() {
        if (this.checked) {
            $('#write_checkbox').prop('checked', true);
        }
    });

    $('#full_control_checkbox').change(function() {
        const checkAll = this.checked;
        $('#read_checkbox, #write_checkbox, #read_execute_checkbox, #modify_checkbox')
            .prop('checked', checkAll);
    });

    $('#read_checkbox').change(function() {
        if (!this.checked) {
            $('#read_execute_checkbox, #full_control_checkbox').prop('checked', false);
        }
    });

    $('#write_checkbox').change(function() {
        if (!this.checked) {
            $('#modify_checkbox, #full_control_checkbox').prop('checked', false);
        }
    });

    $('#read_execute_checkbox').change(function() {
        if (!this.checked) {
            $('#read_checkbox').prop('checked', false);
        }
    });

    $('#modify_checkbox').change(function() {
        if (!this.checked) {
            $('#write_checkbox').prop('checked', false);
        }
    });
});



// ---- Assign unique ids to everything that doesn't have an ID ----
$('#html-loc').find('*').uniqueId() 

