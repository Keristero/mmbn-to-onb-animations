const { readdir ,stat, open, readFile ,writeFile} =  require('fs/promises')
const { createCanvas, loadImage } = require('canvas')
const potpack = require('potpack');
const {filter_folders,file_exists_in_folder,get_first_object_key_value,get_first_object_key_name,round_to_decimal_points} = require('./helpers.js')
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
    let object_index = 0
    const boxes = []
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
                duration:parseInt(frame.FrameDelay)*16.66,
                anchor:parsed_objects[object_index].anchor
            }
            console.log(parsed_frame)
            parsed_animation.frames.push(parsed_frame)
        }
        //after loading all frames, potpack them into a spritesheet by making a list of their boxes
        for(let frame of parsed_animation.frames){
            boxes.push({w:frame.image.width+compact_padding_spacing,h:frame.image.height+compact_padding_spacing,frame:frame})
        }
        parsed_animations.push(parsed_animation)
        animation_index++
        object_index++
    }
    //Now generate the spritesheet with all the frames
    const {w:canvas_width, h:canvas_height, fill} = potpack(boxes);
    const output_canvas = createCanvas(canvas_width,canvas_height)
    const ctx = output_canvas.getContext('2d')
    for(let box of boxes){
        let image = box.frame.image
        let new_x = box.x+compact_side_padding
        let new_y = box.y+compact_side_padding
        let width = box.w-compact_padding_spacing
        let height = box.h-compact_padding_spacing
        //draw the frame
        ctx.drawImage(image, new_x, new_y, width, height)
        //save values to frame for the animation file
        box.frame.x = new_x
        box.frame.y = new_y
        box.frame.width = width
        box.frame.height = height
        ctx.fillStyle = "red"
        ctx.fillRect(new_x, new_y, 1, 1)
        ctx.fillStyle = "rgb(0,255,0)"
        console.log(box.frame.anchor)
        ctx.fillRect(new_x+box.frame.anchor.x, new_y+box.frame.anchor.y, 1, 1)
    }
    await writeFile(`${original_animation_name}.png`, output_canvas.toBuffer())

    console.log("PARSED ANIMATIONS",parsed_animations)


    const animation_file_text = generate_animation_file_contents(parsed_animations)
    await writeFile(`${original_animation_name}.animation`, animation_file_text, { overwrite: true });

}

function generate_animation_file_contents(parsed_animations){
    let output_txt = ""
    let animation_index = 0
    for(let animation of parsed_animations){
        let copies = [{state_name:animation.name,flip_x:false,flip_y:false,speed_multi:1}]

        for(let copy of copies){
            let {state_name,flip_x,flip_y,speed_multi,reverse} = copy

            output_txt += `animation state="${animation_index}"\n`

            if(reverse){
                //Reverse the array if it should be reversed
                animation.frames.reverse()
            }
            for(let frame of animation.frames){
                console.log("FRAME=",frame)
                let {x,y,width,height,duration} = frame
                let {x:anchor_x,y:anchor_y} = frame.anchor

                out_flipped_x = frame.flip_x ? !flip_x : flip_x
                out_flipped_y = frame.flip_y ? !flip_y : flip_y

                let frame_duration = round_to_decimal_points(duration/(1000*speed_multi),3)

                

                output_txt += `frame duration="${frame_duration}" x="${x}" y="${y}" w="${width}" h="${height}" originx="${anchor_x}" originy="${anchor_y}"`
                if(out_flipped_x){
                    output_txt += ` flipx="1"`
                }
                if(out_flipped_y){
                    output_txt += ` flipy="1"`
                }
                output_txt += `\n`
                if(frame.custom_points){
                    for(let point_name in frame.custom_points){
                        let point_pos = frame.custom_points[point_name]
                        output_txt += `point label="${point_name}" x="${point_pos.x}" y="${point_pos.y}"\n`
                    }
                }
            }
            if(reverse){
                //Reverse the array again when we are done to put it back in the correct order
                animation.frames.reverse()
            }

            //Line break between each animation
            output_txt += `\n`
        }
        animation_index++
    }
    return output_txt
}