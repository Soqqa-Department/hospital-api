import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const UserSchema = new mongoose.Schema({
    isAdmin: {
        type: Boolean,
        required: function(){
            return this.role === 'Admin'
        },
    },
    role: {
        type: String,
        required: true,
        enum: ['Admin', 'Doctor', 'Manager']
    },
    username: {
        type: String, 
        unique: true,
        required: true
    },
    password: {
        type: String, 
        required: true
    },
    specialty: {
        type: [String],
        required: function(){
            if(this.role === 'Manager' || this.role === 'Admin' ) return false;
            return true;  
        },
    }, 
    firstName: {
        type: String, 
        required: function(){
            return !this.isAdmin; 
        }
    },
    lastName: {
        type: String, 
        required: function(){
            return !this.isAdmin; 
        }
    },
    phoneNumber: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        required: function(){
            return this.role === 'Doctor'
        },
        default: true
    },
    isManager: {
        type: Boolean,
        requried: function(){
            return this.role === 'Manager'
        }
    }
});

UserSchema.pre("save", async function(){
    const salt = await bcrypt.genSalt(); 
    const hashedPassword = await bcrypt.hash(this.password,salt); 
    this.password = hashedPassword;   
})

UserSchema.methods.ValidatePassword = async function(password){
    return await bcrypt.compare(password, this.password); 
}

const User = mongoose.model("users", UserSchema); 

export default User;