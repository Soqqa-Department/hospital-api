import { StatusCodes } from "http-status-codes";
import { NotFound, Unauthorized } from "../../../customErrors/Errors.js";

const deleteNote = async(req, res, next) => {
    const { Note } = req.models;

    try{
        const { id } = req.params;
        const docsId = req.userId; 
        const note = await Note.findById(id);
        if(!note) throw new NotFound(`Note with ID ${id} not found`);
        else if(note.writtenBy != docsId) throw new Unauthorized("This note is not yours to delete!");
        await Note.deleteOne({_id: id}); 
        return res.status(StatusCodes.ACCEPTED).json({success: true});
    }catch(err){
        return next(err); 
    }
}
export default deleteNote; 