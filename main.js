const { readdir ,stat, open, readFile } =  require('fs/promises')
const {filter_folders,file_exists_in_folder} = require('./helpers.js')
const path = require('path')
const X2JS = require('x2js')

const names = {
    animations:"animations.xml",
    object_list:"objectLists.xml",
    frame_delay:"FrameDelay",
    loop_flag:"_Loop"
}

const input_folder_path = `E://00_pl`
const output_folder_path = `./output`

main()

async function main(){
    const animation_folder_list = await add_animation_folders_to_list(path.resolve(input_folder_path))
    for(let folder_path of animation_folder_list){
        await parse_mmbn_animation_folder(folder_path)
        return
    }
}

async function add_animation_folders_to_list(root_folder,animation_folder_list = []){
    //Recursively scan for animations.xml to in subfolders until we have all animations
    if(await file_exists_in_folder(root_folder,names.animations)){
        //If we are in an animation folder, add it to the list
        animation_folder_list.push(root_folder)
        console.log(`found animation folder ${root_folder}`)
        return
    }
    //look through all subfolders for animation folders
    const files = await readdir(root_folder,{withFileTypes:true});
    const sub_folders = files.filter(filter_folders)
    for(let sub_folder of sub_folders){
        let folder_path = path.join(root_folder, sub_folder.name)
        await add_animation_folders_to_list(folder_path,animation_folder_list)
    }
    return animation_folder_list
}

async function parse_xml_document(xml_path){
    const xml_file = await readFile(xml_path, 'utf8')
    //console.log('opened animation file',animation_file)
    let x2js = new X2JS();
    let document = x2js.xml2js(xml_file);
    return document
}


async function parse_mmbn_animation_folder(folder_path){
    const output = {animation_states:[]}

    const object_list_path = path.join(folder_path,names.object_list)
    const object_list_doc = await parse_xml_document(object_list_path)

    const animation_file_path = path.join(folder_path,names.animations)
    const anim_doc = await parse_xml_document(animation_file_path)
    const keys = Object.keys(anim_doc)
    if(!keys[0]){
        return
    }
    const animation_name = keys[0]
    const animations_document = anim_doc[animation_name]
    for(let animation_state_name in animations_document){
        const animation_state_document = animations_document[animation_state_name]
        const new_state = parse_mmbn_animation_state(animation_state_name,animation_state_document)
        output.animation_states.push(new_state)
    }
    console.log(output)
    return output
}

function parse_mmbn_animation_state(animation_state_name,mmbn_animations_document){
    console.log('animation doc',mmbn_animations_document)
    const output = {
        name:animation_state_name,
        frames:[]
    }
    for(let key in mmbn_animations_document){
        let value = mmbn_animations_document[key]
        if(key == names.loop_flag){
            output.loop = value == "True"
        }else{
            let frame_document = value
            let new_frame = parse_mmbn_animation_frame(frame_document)
            output.frames.push(new_frame)
        }
    }
    return output
}

function parse_mmbn_animation_frame(mmbn_frame_document){
    console.log('frame doc',mmbn_frame_document)
    const output = {
        delay:frames_to_milliseconds(mmbn_frame_document[names.frame_delay])
    }
    return output
}

function frames_to_milliseconds(frames){
    return frames*16.66
}