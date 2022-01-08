const { readdir ,stat, open, readFile } =  require('fs/promises')
const {filter_folders,file_exists_in_folder} = require('./helpers.js')
const path = require('path')
const X2JS = require('x2js')
const names = {
    animations:"animations.xml"
}

const input_folder_path = `C://Users//Keris//Desktop//BN All Sprites//ROCKEXE6_GXXBR5J08//00_pl`
const output_folder_path = `./output`

main()

async function main(){
    const animation_folder_list = await add_animation_folders_to_list(path.resolve(input_folder_path))
    for(let folder_path of animation_folder_list){
        await convert_animation_to_onb(folder_path)
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

async function convert_animation_to_onb(folder_path){
    const animation_file_path = path.join(folder_path,names.animations)
    const animation_doc = await parse_xml_document(animation_file_path)
    console.log(animation_doc)
}