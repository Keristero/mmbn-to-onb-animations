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

module.exports = {filter_folders,file_exists_in_folder}