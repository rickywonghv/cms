/**
 * Created by damon on 6/14/16.
 */
var express = require('express');
var path = require('path');
var app = express();
var bcrypt=require('bcrypt-nodejs');
var datetime = require('node-datetime');
var check = require('check-types');
var mongoose=require('mongoose');
var jwt = require('jsonwebtoken');
var fs=require("fs");
require("../db.js");

var Auth=function(query,next){
    var Admin=mongoose.model("admin");
    if(!check.null(query.username&&query.password)&&!check.undefined(query.username&&query.password)){
        var username=query.username;
        var password=query.password;
        Admin.findOne({username:username},function(err,admin){
            if(admin){
                if(username==admin.username&&ckpwd(password,admin.password)&&admin.permission!=0){
                    var token=signToken({sub:admin._id,iss:"damonCMS",username:username,per:admin.permission,firstname:admin.firstname,lastname:admin.lastname});
                    next({success:true,token:token,status:200});
                }else if(admin.permission==0){
                    next({success:false,reason:"Your Account is blocked already",status:401});
                }else{
                    next({success:false,reason:"Wrong Username or Password",status:401});
                }
            }else{
                next({success:false,reason:"Wrong Username or Password",status:401});
            }
        });
    }else{
        next({success:false,reason:"Miss Params",status:400});
    }
};

var AddAdmin=function(json,next){
    var Admin=mongoose.model("admin");
    if(!check.null(json.token&&json.newuser&&json.newpwd&&json.newconpwd&&json.newemail&&json.newfname&&json.newlname&&json.newper)&&!check.undefined(json.token&&json.newuser&&json.newpwd&&json.newconpwd&&json.newemail&&json.newfname&&json.newlname&&json.newper)){
        var token=json.token;
        var username=json.newuser;
        var password=json.newpwd;
        var conpassword=json.newconpwd;
        var email=json.newemail;
        var fname=json.newfname;
        var lname=json.newlname;
        var per=json.newper;
        var date=datetime.create().now();
        suOnly(token,function(result){
            if(result){
                if(password!=conpassword){
                    next({success:false,reason:"Password are not match",error:"notMatch",status:400});
                }else{
                    var newUser=new Admin({username:username,password:ctpwd(password),email:email,firstname:fname,lastname:lname,permission:per,creatDT:date,updateDT:date});
                    newUser.save(function(err,data){
                       if(err){
                           next({success:false,reason:err,status:400});
                       }else{
                           next({success:true,reason:"success",status:201});
                       }
                    });
                }
            }else{
                next({success:false,reason:"No Permission",error:"noPer",status:401});
            }
        });
    }else{
        next({success:false,reason:"Miss Params",status:400});
    }
};

var AdminList=function(json,next){
    var Admin=mongoose.model("admin");
    if(!check.null(json.token,json.query)&&!check.undefined(json.token,json.query)){
        var token=json.token;
        var query=json.query;
        if(query=="All"||query=="all"){
            var search={};
        }else{
            var search=json.query;
        }
        suOnly(token,function(data){
            if(data){
                Admin.find(search,"username permission email firstname lastname permission creatDT",function(err,data){
                    if(err) next(err);
                    next({success:true,data:data,status:200});
                });
            }else{
                next({success:false,reason:data,status:401});
            }
        })
    }else{
        next({success:false,reason:"Miss Params",status:400});
    }
    
};

var AdminChpwd=function(json,next){
    var Admin=mongoose.model("admin");
    if(!check.null(json.token,json.query.opwd,json.query.npwd,json.query.conpwd)&&!check.undefined(json.token,json.query,json.query.opwd,json.query.npwd,json.query.conpwd)&&check.nonEmptyString(json.token,json.query.opwd,json.query.npwd,json.query.conpwd)){
        var token=json.token;
        var opwd=json.query.opwd;
        var npwd=json.query.npwd;
        var conpwd=json.query.conpwd;
        if(npwd==conpwd){
            verToken(token,function(data){
               if(data.success){
                   var username=data.decoded.username;
                   var pwd=ctpwd(npwd);
                   var date=datetime.create().now();
                   Admin.findOne({username:username},function(err,user){
                       if(ckpwd(opwd,user.password)){
                           updateAdmin({ username:username },{password:pwd,updateDT:date},function(data){
                               if(data.success){
                                   next({success:true,reason:"success",status:200});
                               }else{
                                   next({success:false,reason:data,status:400});
                               }
                           });
                       }else{
                           next({success:false,reason:"Wrong Old password",status:400});
                       }
                   })
               }else{
                   next({success:false,reason:"Invalid Token",status:401});
               }
            });
        }else{
            next({success:false,reason:"Password are not match",status:400});
        }
    }else{
        next({success:false,reason:"Miss Params",status:400});
    }
};

var AdminChPer=function(json,next){
    if(check.object(json)&&!check.null(json.token,json.per,json.user)&&!check.undefined(json.token,json.per,json.user)){
        var token=json.token;
        var per=json.per;
        var user=json.user;
        suOnly(token,function(data){
            if(data){
                       updateAdmin({username:user},{permission:per},function(data){
                           if(data.success){
                               next({success:true,reason:"success",status:200});
                           }else{
                               next({success:false,reason:data,status:400});
                           }
                       });
            }else{
                next({success:false,reason:"Invalid Token",status:401});
            }
        })
    }else{
        next({success:false,reason:"Miss Params",status:400});
    }
};

function updateAdmin(json,query,next){
    var Admin=mongoose.model("admin");
    Admin.findOneAndUpdate(json,query,function(err,data){
        if(err){
            next({success:false,err:err});
        }else{
            next({success:true,data:data});
        }
    })
}

function ckpwd(data,encrypt){
    if(check.null(data,encrypt)||check.undefined(data,encrypt)){
        return false;
    }else{
        return bcrypt.compareSync(data,encrypt);
    }
}

function ctpwd(pwd){
    if(check.null(pwd)||check.undefined(pwd)){
        return false;
    }else{
        return bcrypt.hashSync(pwd, bcrypt.genSaltSync());
    }
}

function signToken(json){
    if(check.object(json)){
        var cert = fs.readFileSync('./key/adminPrivate.key');
        var token = jwt.sign(json, cert, { algorithm: 'RS256',expiresIn:"5h"});
        return token;
    }else{
        return false;
    }
}

function verToken(token,next){
    if(check.null(token)){
        next({success:false,reason:"Not Token",status:401});
    }else{
        var cert = fs.readFileSync('./key/adminPublic.key');
        jwt.verify(token, cert, { issuer: 'damonCMS' },function(err,decoded){
            if(err){
                next({success:false,reason:"Miss Params",error:err,status:401});
            }else{
                next({success:true,decoded:decoded,status:200});
            }
        });
    }

}

function suOnly(token,next){
    if(check.null(token)){
        next(false);
    }else {
        var cert = fs.readFileSync('./key/adminPublic.key');
        jwt.verify(token, cert, {issuer: 'damonCMS'}, function (err, decoded) {
            if (err) {
                next(false);
            } else {
                if (decoded.per != 1) {
                    next(false);
                } else {
                    next(true);
                }
            }
        });
    }
}

module.exports.Auth=Auth;
module.exports.AddAdmin=AddAdmin;
module.exports.AdminList=AdminList;
module.exports.AdminChpwd=AdminChpwd;
module.exports.AdminChPer=AdminChPer;

module.exports.suOnly=suOnly;
module.exports.verToken=verToken;
