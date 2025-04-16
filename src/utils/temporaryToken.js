import crypto from "crypto"

export const generateTemporaryToken = function(){
    const unHashedToken = crypto.randomBytes(20).toString('hex')
    const hashedToken = crypto.createHash("sha256")
    .update(unHashedToken)
    .digest("hex");
    const tokenExpiry = Date.now() + 20 * 60 * 1000; 
    return {unHashedToken, hashedToken, tokenExpiry}
}
export const isTokenMatch = function(unHashedToken, hashedToken){
    const newHashedToken = crypto.createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

    return newHashedToken === hashedToken
}