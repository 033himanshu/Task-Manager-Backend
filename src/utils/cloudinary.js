import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

const cloud_name =process.env.CLOUDINARY_CLOUD_NAME
const api_key = process.env.CLOUDINARY_API_KEY
const api_secret = process.env.CLOUDINARY_API_SECRET
cloudinary.config({ cloud_name, api_key, api_secret})
const folder = 'authorizationSystem'



const uploadOnCloudinary = async (localFilePath) =>{
    let response = null
    try{
        if(!localFilePath) return null
        //upload the  file on cloudinary
        response = await cloudinary.uploader.upload(localFilePath, {
            folder,
            resource_type: 'auto',
        })
        // file has been  uploaded succesfully
        console.log("file uploaded successfully", response)
    }catch(error){
        console.log(error)
    }finally{
        fs.unlinkSync(localFilePath) // remove the  locally saved temporary file as the  upload operation got failed
    }
    return response
}

const replaceOnCloudinary = async(cloudinaryFilePath, localFilePath) => {
    let response = null
    try {
        if(!localFilePath) return null
        let public_id = `${folder}/`+cloudinaryFilePath.split(`${folder}/`)[1].split('.')[0]
        response = await cloudinary.uploader.upload(localFilePath, {
            public_id,
            overwrite: true,
            invalidate: true,
            resource_type: 'auto',
        })
    }catch(error){
        console.log(error)
    }finally{
        fs.unlinkSync(localFilePath) // remove the  locally saved temporary file as the  upload operation got failed
    }
    return response
}

const destroyOnCloudinary = async(cloudinaryFilePath) => {
    let response = null
    try {
        if(!cloudinaryFilePath) return null
        let public_id = `${folder}/`+cloudinaryFilePath.split(`${folder}/`)[1].split('.')[0]
        response = await cloudinary.uploader.destroy(public_id)
    }catch(error){
        console.log(error)
    }
    return response
}

export {uploadOnCloudinary, replaceOnCloudinary, destroyOnCloudinary}