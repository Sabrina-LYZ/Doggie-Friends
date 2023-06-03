// 1ST DRAFT DATA MODEL
import mongoose from 'mongoose'
import slug from 'mongoose-slug-updater';
import findOrCreatePlugin from "mongoose-findorcreate";
import passportLocalMongoose from 'passport-local-mongoose'

mongoose.plugin(slug);

// users
const UserSchema = new mongoose.Schema({
  username:String,
  email:{type:String, sparse:true},
  password:{type:String,sparse:true},
  googleId:String
});

UserSchema.plugin(passportLocalMongoose)
UserSchema.plugin(findOrCreatePlugin)

const User = mongoose.model("User",UserSchema)

// Dog Schema
const DogSchema = new mongoose.Schema({
  dogImage:{type:Buffer},
  dogImageType:{type:String},

  dogName: {type: String, required: true},
  dogBreed:{type: String, required:true},
  dogAge: {type:Number},
  dogGender:{type:String,required:true},
  dogSkills:{type:String},
  dogIntro:{type:String},
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  slug: {type: String, slug: ['dogName','dogBreed','dogAge','dogGender'], unique: true},
  createdAt:{type:Date,default:Date.now}
});

DogSchema.virtual('dogImagePath').get(function(){
  if(this.dogImage && this.dogImageType){
    const path = `data:${this.dogImageType};charset=utf-8;base64,${this.dogImage.toString('base64')}`
    return path
  }
})



const Dog = mongoose.model("Dog",DogSchema)

export{
  User,Dog
}
