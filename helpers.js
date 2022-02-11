const {stat } =  require('fs/promises')
const path = require('path')

filter_folders = function(dirent){
    if(dirent.isDirectory()){
        return true
    }
}

file_exists_in_folder = async function(folder_path,file_name){
    try{
        let file_info = await stat(path.resolve(folder_path,file_name))
        if(file_info){
            return true
        }
    }catch(e){
        return false
    }
}

get_first_object_key_value = function(object){
    let first_key_name = Object.keys(object)[0]
    return object[first_key_name]
}

get_first_object_key_name = function(object){
    let first_key_name = Object.keys(object)[0]
    return first_key_name
}

function round_to_decimal_points(num,x) {
    return +(Math.round(num + `e+${x}`)  + `e-${x}`);
}


module.exports = {filter_folders,file_exists_in_folder,get_first_object_key_value,get_first_object_key_name,round_to_decimal_points}