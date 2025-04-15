import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

const cloud_name =process.env.CLOUDINARY_CLOUD_NAME
const api_key = process.env.CLOUDINARY_API_KEY
const api_secret = process.env.CLOUDINARY_API_SECRET
cloudinary.config({ cloud_name, api_key, api_secret})

import {CloudinaryFolderEnum} from './constants.js'
const mainFolder = CloudinaryFolderEnum.MAIN



const uploadOnCloudinary = async (localFilePath, folder) =>{
    let response = null
    folder = folder = `${mainFolder}/${folder}`
    try{
        if(!localFilePath) return null
        //upload the  file on cloudinary
        response = await cloudinary.uploader.upload(localFilePath, {
            folder,
            resource_type: 'auto',
        })
        // file has been  uploaded succesfully
        console.log("file uploaded successfully", response)
    }finally{
        fs.unlinkSync(localFilePath) // remove the  locally saved temporary file as the  upload operation got failed
    }
    return response
}

const replaceOnCloudinary = async(cloudinaryFilePath, localFilePath, folder) => {
    let response = null
    folder = `${mainFolder}/${folder}/`
    try {
        if(!localFilePath) return null
        let public_id = `${folder}`+cloudinaryFilePath?.split(`${folder}`)[1]?.split('.')[0]
        response = await cloudinary.uploader.upload(localFilePath, {
            public_id,
            overwrite: true,
            invalidate: true,
            resource_type: 'auto',
        })
    }finally{
        fs.unlinkSync(localFilePath) // remove the  locally saved temporary file as the  upload operation got failed
    }
    return response
}

const destroyOnCloudinary = async(cloudinaryFilePath, folder) => {
    let response = null
    folder = `${mainFolder}/${folder}/`
    console.log(folder)
    if(!cloudinaryFilePath) return null
    let public_id = `${folder}`+cloudinaryFilePath?.split(`${folder}`)[1]?.split('.')[0]
    console.log(public_id)

    response = await cloudinary.uploader.destroy(public_id)
    return response
}
// https://res.cloudinary.com/dbebtmv0x/image/upload/v1744591181/task-manager/attachments/67fc3cb285bc9ed30677b09f/kiycnb5m2ke9kl9woyzr.png
const destroyFolderOnCloudinary = async (folder) => {
    const fullFolderPath = `${mainFolder}/${folder}/`;
    console.log(fullFolderPath);
  
    try {
      // Try deleting all files in the folder (won't error if folder doesn't exist)
      await cloudinary.api.delete_resources_by_prefix(fullFolderPath);
      console.log("files deleted");
  
      // Now try deleting the folder itself
      const response = await cloudinary.api.delete_folder(fullFolderPath);
      console.log("folder deleted");
  
      return response;
    } catch (error) {
      const errMsg = error.message || "";
      
      // Handle error only if it's NOT about folder not found
      if (errMsg.includes("not found") || errMsg.includes("Could not find")) {
        console.warn(`Folder not found on Cloudinary: ${fullFolderPath}`);
        return null; // Or return a custom object saying folder didn't exist
      }
      throw new ApiError(501, `Error deleting folder from Cloudinary: ${errMsg}`);
    }
  };
  


export {uploadOnCloudinary, replaceOnCloudinary, destroyOnCloudinary, destroyFolderOnCloudinary}

// cloudinary.uploader.delete_resources_by_prefix(folder)