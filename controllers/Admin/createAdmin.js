const Admin = require("../../db/models/Admin");  
const { StatusCodes } = require('http-status-codes');
const createAdmin = async (req, res, next) => {
    try{
        console.log(req.body)
        const { username, password } = req.body; 
        const admin = await Admin.create({username, password}); 
        if(!admin) return res.status(StatusCodes.BAD_REQUEST).json({success: false}) 
        return res.status(StatusCodes.CREATED).json({success: true, msg: 'Admin has been created'});
    }catch(err){
        return next(err); 
    }
}

module.exports = createAdmin; 