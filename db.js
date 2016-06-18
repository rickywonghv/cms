/**
 * Created by damon on 6/13/16.
 */
var mongoose=require("mongoose");
var uniqueValidator = require('mongoose-unique-validator');
var autopopulate=require('mongoose-autopopulate');
mongoose.connect("mongodb://localhost:27017/cms");
var db = mongoose.connection;
db.on('error', console.error.bind(console,'connection error:'));
db.once('open', function (callback) {
    console.log("MongoDB Connected!");
});
var Schema=mongoose.Schema;
var user=new Schema({
    username:{type:String,unique:true},
    password:String,
    email:String,
    name:String,
    createDT:Number
});

var admin=new Schema({
    username:{type:String,unique:true,required:[true, 'No Username?']},
    password:{type:String,required:true},
    email:{type:String,unique:true,required:[true, 'No Username?'],uniqueCaseInsensitive: true},
    firstname:String,
    lastname:String,
    permission:Number,
    creatDT:Number,
    updateDT:Number
});

var post=new Schema({
    title:{type:String,unique:true,required:[true, 'No Title?']},
    content:{type:String,required:[true, 'No content?'],uniqueCaseInsensitive:true},
    hashTag:{type:String},
    createDT:{type:Number,required:[true,"No DateTime"]},
    updateDT:{type:Number,required:[true,"No DateTime"]},
    createBy:{type:String,ref:'admin',autopopulate: true},
    photos:[{type:String,ref:'photos',autopopulate: true}]
});

var photo=new Schema({
   caption:{type:String,require:true},
    file:[{fieldname: String,
       originalname: String,
       encoding: String,
       mimetype: String,
       destination: String,
       filename: String,
       path: String,
       size: Number,
       location:String
   }],
   createDT:{type:Number,unique:false},
   awsS3:{type:Boolean,unique:false}
});


user.plugin(uniqueValidator, { message: 'Error, expected {PATH} to be unique.' });
admin.plugin(uniqueValidator,{ message: 'Sorry, {PATH}: {VALUE} is used.' });
post.plugin(uniqueValidator,{ message: 'Sorry, {PATH}: {VALUE} is used.' });
photo.plugin(uniqueValidator,{ message: 'Sorry, {PATH}: {VALUE} is used.' });

module.exports=mongoose.model("admin",admin);
module.exports=mongoose.model("user",user);
module.exports=mongoose.model("posts",post);
module.exports=mongoose.model("photo",photo);