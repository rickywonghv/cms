/**
 * Created by damon on 6/17/16.
 */
var express = require('express');
var datetime = require('node-datetime');
var multer = require('multer');
var fs=require("fs");
var mongoose=require("mongoose");
var check=require("check-types");
require("../db.js");
var Admin=require("./auth.js");
var Posts=require("./post.js");


var ImgFileFilter=function(req,file,cb){
  if(file.mimetype!=="image/png"&&file.mimetype!=="image/jpeg"){
      var errmsg="Invalid Type";
      req.fileValidation=errmsg;
      return cb(null,false,new Error(errmsg));
  }
    return cb(null,true);

};
var ImgDest='img/';
var ImgLimits={
    fileSize: 5000000
};

var ImgUpload=function(field,req,res,next){
    var Photos=mongoose.model("photo");
    var upload = multer({dest:ImgDest,limits:ImgLimits,fileFilter:ImgFileFilter}).single(field);
    upload(req, res, function (err) {
        Admin.suOnly(req.body.token,function(result){
            if(result){
                if (err) {
                    next({success:false,reason:err.message,status:400});
                    return;
                }
                if(req.fileValidation){
                    next({success:false,reason:req.fileValidation,status:400});
                    return;
                }

                var newPhoto={
                    caption:req.body.caption,
                    file:[req.file],
                    createDT:datetime.create().now(),
                    awsS3:true};
                var photo=new Photos(newPhoto);
                photo.save(function(err){
                    if(err){
                        console.log(err.message);
                        fs.unlinkSync(req.file.path);
                        return next({success:false,error:err,status:400});
                    }
                    return next({success:true,reason:"success",status:201});
                });
            }else{
                fs.unlinkSync(req.file.path);
                return next({success:false,error:"Invalid Token",status:400});
            }
        });
    });
};

var ImgList=function(token,next){
    Admin.suOnly(token,function(result){
        if(result){
            imgFind({},function(data){
                if(data.success){
                    next(data);
                }else{
                    next({success:false,error:"Invalid Param",status:400})
                }
            });
        }else{
            next({success:false,error:"Invalid Token",status:401})
        }
    })
};

var ImgShow=function(token,id,next){
    Admin.suOnly(token,function(result){
        if(result){
            imgFindFilter({_id:id},"file",function(data){
                next(data);

            });
        }else{
            next({success:false,error:"Invalid Token",status:401})
        }
    })
};

var ImgDel=function(token,id,next){
    Admin.suOnly(token,function(result){
        if(result){
            imgDel({_id:id},function(data){
                next(data);
            })
        }else{
            next({success:false,error:"Invalid Token",status:401})
        }
    })
};

function imgDel(query,next){
    var Photos=mongoose.model("photo");
    imgFind(query,function(data){
        if(data.success&&!check.undefined(data.data[0].file)){
            console.log(data);
            var path=data.data[0].file[0].path;
            var filename=data.data[0].file[0].filename;
            fs.unlinkSync(path);
            Photos.remove(query,function(err){
                if(err){
                    return next({success:false,error:err,status:400});
                }else{
                    return next({success:true,reason:"success",status:200});
                }
            })
        }else{
            return next({success:false,error:"Invalid Image ID",status:400});
        }
    })
}

function imgFind(query,next){
    var Photos=mongoose.model("photo");
    if(check.object(query)){
        Photos.find(query,function(err,data){
            if(err){
                return next({success:false,error:err,status:400});
            }else{
                if(data){
                    return next({success:true,data:data,status:200});
                }else{
                    return next({success:false,data:"null",status:200});
                }

            }
        })
    }else{
        next({success:false,error:"Invalid Query",status:400});
    }
}

function imgFindFilter(query,filter,next){
    var Photos=mongoose.model("photo");
    if(check.object(query)){
        Photos.findOne(query,filter,function(err,data){
            if(err){
                return next({success:false,error:err,status:400});
            }else{
                if(data){
                    return next({success:true,data:{originalname:data.file[0].originalname,filename:data.file[0].filename,path:data.file[0].path,mimetype:data.file[0].mimetype},status:200});
                }else{
                    return next({success:false,reason:"null",status:200});
                }

            }
        })
    }else{
        next({success:false,error:"Invalid Query",status:400});
    }
}


module.exports.ImgUpload=ImgUpload;
module.exports.ImgList=ImgList;
module.exports.ImgShow=ImgShow;
module.exports.ImgDel=ImgDel;