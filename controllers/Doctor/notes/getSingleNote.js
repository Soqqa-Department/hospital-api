import { StatusCodes } from "http-status-codes";


const getSingleNote = async(req, res, next) => {
    const { Note } = req.models;

    try{
        const {id} = req.params; // note id 
        const note = await Note.findById(id); 
        return res.status(StatusCodes.OK).json({success: true, note});
    }catch(err){
        return next(err);
    }
}

export default getSingleNote;