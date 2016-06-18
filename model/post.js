/**
 * Created by damon on 6/14/16.
 */
var express = require('express');
var path = require('path');
var app = express();
var datetime = require('node-datetime');
var check = require('check-types');
var mongoose=require('mongoose');
var fs=require("fs");
require("../db.js");
var Admin=require("./auth.js");

var AddPost=function(json,next){
    if(check.object(json)){
        Admin.suOnly(json.token,function(data){
            if(data){
                Admin.verToken(json.token,function(usert){
                    if(usert.success){
                        var userid=usert.decoded.sub;
                        var title=json.title;
                        var content=json.content;
                        var hashtag=json.hashtag;
                        var postJson={createBy:userid,title:title,content:content,hashtag:hashtag};
                        Add(postJson,function(data){
                            next(data);
                        })
                    }else{
                        next({status:401,reason:"No Permission ot Invalid Token",error:"No Permission"});
                    }
                });               
            }else{
                next({status:401,reason:"No Permission ot Invalid Token",error:"No Permission"});
            }
        });
    }else{
        next({status:401,reason:"Miss Params",error:"Miss Params"});
    }
};

var DelPost=function(json,next){
    if(check.object(json)&&check.string(json.token)){
        Admin.suOnly(json.token,function(res){
            if(res){
                        Del({_id:json.id},function(a){
                            next(a);
                        });
            }else{
                next({status:401,reason:"No Permission ot Invalid Token",error:"No Permission"});
            }
        })
    }else{
        next({status:401,reason:"Miss Params",error:"Miss Params"});
    }
};

var ListPost=function(json,next){
    Admin.suOnly(json.token,function(res){
        List(function(data){
            next(data);
        })
    })
};

function Add(json,next){
    var Posts=mongoose.model("posts");
    var date=datetime.create().now();
    var posts=new Posts({
        title:json.title,
        content:json.content,
        hashTag:json.hashtag,
        createDT:date,
        updateDT:date,
        createBy:json.createBy
    });
    posts.save(function(err,data){
        if(err){
            next({success:false,reason:err,status:400});
        }else{
            next({success:true,reason:"Success",status:201});
        }   
    });
}

function Del(json,next){
    var Posts=mongoose.model("posts");
    Posts.remove(json,function(err,data){
       if(err){
           next({success:false,reason:err,status:400});
       }else{
           next({success:true,reason:"Success",status:200});
       }
    });
}

function List(next){
    var Posts=mongoose.model("posts");
    Posts.find({},function(err,data){
        if(err){
            next({success:false,reason:err,status:400});
        }else{
            next({success:true,data:data,reason:"Success",status:200});
        }
    })
}

module.exports.AddPost=AddPost;
module.exports.DelPost=DelPost;
module.exports.ListPost=ListPost;