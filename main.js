const { readdir ,stat, open, readFile ,writeFile} =  require('fs/promises')
const { createCanvas, loadImage } = require('canvas')
const potpack = require('potpack');
const {filter_folders,file_exists_in_folder,get_first_object_key_value,get_first_object_key_name} = require('./helpers.js')
const path = require('path')
const X2JS = require('x2js')
const names = {
    animations:"animations.xml",
    object_lists:"objectLists.xml",
    sub_anims:"subAnims.xml",
}
const compact_padding_spacing = 4 //4 pixels total, 2 either side
const compact_side_padding = Math.floor(compact_padding_spacing*0.5)

const input_folder_path = `C://Users//Keris//Desktop//BN All Sprites//test_inputs`
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

function parse_fragment_size(size_string){
    console.log(size_string)
    let arr_values = size_string.split('x')
    let size = {
        x:parseInt(arr_values[0]),
        y:parseInt(arr_values[1])
    }
    return size
}

function parse_fragment_position(pos_string){
    let arr_values = pos_string.split(',')
    let size = {
        x:parseInt(arr_values[0]),
        y:parseInt(arr_values[1])
    }
    return size
}


function find_object_anchor(object){
    //TODO remove parsing of size and maximum coordinates for speed
    let bounds = {
        min:{x:Infinity,y:Infinity},
        max:{x:-Infinity,y:-Infinity}
    }
    for(let fragment_name in object){
        let fragment = object[fragment_name]
        console.log(fragment)
        let size = parse_fragment_size(fragment.Size)
        let position = parse_fragment_position(fragment.PositionXY)
        let fragment_min_x = position.x
        let fragment_min_y = position.y
        let fragment_max_x = position.x+size.x
        let fragment_max_y = position.y+size.y
        if(fragment_min_x < bounds.min.x){
            bounds.min.x = fragment_min_x
        }
        if(fragment_min_y < bounds.min.y){
            bounds.min.y = fragment_min_y
        }
        if(fragment_max_x > bounds.max.x){
            bounds.max.x = fragment_max_x
        }
        if(fragment_max_y > bounds.max.y){
            bounds.max.y = fragment_max_y
        }
    }
    //console.log('bounds = ',bounds)
    return {
        x:Math.abs(bounds.min.x),
        y:Math.abs(bounds.min.y)
    }
}

async function convert_animation_to_onb(folder_path){
    console.log(`parsing animation from ${folder_path}`)

    //Parse objects
    const object_lists_path = path.join(folder_path,names.object_lists)
    const object_lists_doc = await parse_xml_document(object_lists_path)
    console.log(object_lists_doc)
    let object_list = get_first_object_key_value(object_lists_doc)
    let parsed_objects = []
    for(let object_name in object_list){
        let object = get_first_object_key_value(object_list[object_name])
        let anchor = find_object_anchor(object)
        let parsed_object = {
            anchor:anchor
        }
        parsed_objects.push(parsed_object)
    }
    console.log("PARSED OBJECTS",parsed_objects)

    //TODO parse sub animations, they dont seem to be required for most things

    //Parse animations
    const animation_file_path = path.join(folder_path,names.animations)
    const animation_doc = await parse_xml_document(animation_file_path)
    console.log(animation_doc)
    let original_animation_name = get_first_object_key_name(animation_doc)
    let animations = animation_doc[original_animation_name]
    let parsed_animations = []
    let animation_index = 0
    for(let animation_name in animations){
        let frames = animations[animation_name]
        let frame_index = 0
        let parsed_animation = {
            name:`${original_animation_name}_${animation_name}`,
            loop:frames._Loop == "True",
            frames:[]
        }
        for(let frame_index = 0; frame_index < Infinity; frame_index++){
            let frame = frames[`Frame${frame_index}`]
            if(!frame){
                break; //break the loop if we run out of frames
            }
            let image_path = path.join(folder_path,'frames',`animation_${animation_index}_frame_${frame_index}.png`)
            let parsed_frame = {
                image:await loadImage(image_path),
                delay:parseInt(frame.FrameDelay)*16.66,
                anchor:parsed_objects[frame_index]
            }
            console.log(parsed_frame)
            parsed_animation.frames.push(parsed_frame)
        }
        //after loading all frames, potpack them into a spritesheet by making a list of their boxes
        const boxes = []
        for(let frame of parsed_animation.frames){
            boxes.push({w:frame.image.width+compact_padding_spacing,h:frame.image.height+compact_padding_spacing,img:frame.image})
        }
        const {w:canvas_width, h:canvas_height, fill} = potpack(boxes);
        console.log(canvas_width,canvas_height)
        console.log('anim boxes',boxes)
        const output_canvas = createCanvas(canvas_width,canvas_height)
        const ctx = output_canvas.getContext('2d')
        for(let box of boxes){
            ctx.drawImage(box.img, box.x+compact_side_padding, box.y+compact_side_padding, box.w-compact_padding_spacing, box.h-compact_padding_spacing)
        }
        await writeFile(`${parsed_animation.name}.png`, output_canvas.toBuffer())


        parsed_animations.push(parsed_animation)
        animation_index++
    }

    console.log("PARSED ANIMATIONS",parsed_animations)

}