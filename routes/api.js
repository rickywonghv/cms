/**
 * Created by damon on 6/13/16.
 */
var express = require('express');
var router = express.Router();
var bcrypt=require('bcrypt-nodejs');
var datetime = require('node-datetime');
var mongoose=require('mongoose');
var check = require('check-types');
var Admin= require("../model/auth.js");
var Posts=require("../model/post.js");
var Img=require("../model/upload.js");

router.post('/login',function(req, res, next) {
    var username=req.body.username;
    var password=req.body.password;
    Admin.Auth({username:username,password:password},function(data){
        if(data.status==200){
            res.status(data.status).type('json').json(data);
        }else{
            res.status(data.status).type('json').json(data);
        }
    });
});

router.patch('/adminper',function(req,res){
    var token=req.body.token;
    var per=req.body.per;
    var user=req.body.user;
    var query={token:token,per:per,user:user};
    Admin.AdminChPer(query,function(ret){
        res.json(ret);
    })
});

router.post('/addadmin', function(req, res, next) {
    var token=req.body.token;
    var user=req.body.user;
    var pass=req.body.pwd;
    var conpwd=req.body.conpwd;
    var first=req.body.fname;
    var last=req.body.lname;
    var email=req.body.email;
    var per=req.body.per;
    var query={token:token,newuser:user,newpwd:pass,newconpwd:conpwd,newemail:email,newfname:first,newlname:last,newper:per};
    Admin.AddAdmin(query,function(data){
        res.status(data.status).type('json').json(data);
    })
});

router.get('/adminlist',function(req,res,next){
   var token=req.param("token");
   var user=req.param("username");
   if(check.null(user)||check.undefined(user)||check.emptyString(user)){
       var qu="all";
   }else{
       var qu={username:user};
   }
   Admin.AdminList({token:token,query:qu},function(data){
       res.status(data.status).type('json').json(data);
   });
});

router.get('/logout',function(req,res,next){
    res.clearCookie("token");
    res.status(200).json({success:true});
});

router.put('/chpwd',function(req,res){
    var token=req.body.token;
    var opwd=req.body.opwd;
    var npwd=req.body.npwd;
    var conpwd=req.body.conpwd;
    var json={token:token,query:{opwd:opwd,npwd:npwd,conpwd:conpwd}};
    Admin.AdminChpwd(json,function(data){
        res.status(data.status).json(data);
    })
});

router.post('/posts',function(req,res){
    var token=req.body.token;
    var title=req.body.title;
    var content=req.body.content;
    var hashtag=req.body.hashtag;
    Posts.AddPost({token:token,title:title,content:content,hashtag:hashtag},function(data){
        res.json(data);
    })
});

//Upload Image
router.post('/upload/img',function(req,res){
    Img.ImgUpload("photos",req,res,function (a) {
        res.status(a.status).json(a);
    })
});
//List all Images
router.get('/img',function(req,res){
    Img.ImgList(req.param('token'),function(data){
        res.status(data.status).json(data);
    })
});
//Show Image
router.get('/img/:id',function(req,res,next){
    Img.ImgShow(req.param('token'),req.params.id,function(data){
        if(data.success){
            res.header("Content-Type", data.data.mimetype);
            //res.status(data.status).download(data.data.path, data.data.originalname);
            res.status(data.status).sendfile(data.data.path);
            //res.json(data);
        }else{
            res.status(data.status).json(data);
        }
    })
});
//Download Image
router.get('/img/download/:id',function(req,res,next){
    Img.ImgShow(req.param('token'),req.params.id,function(data){
        if(data.success){
            res.header("Content-Type", data.data.mimetype);
            res.status(data.status).download(data.data.path, data.data.originalname);
            //res.json(data);
        }else{
            res.status(data.status).json(data);
        }
    })
});

router.delete('/img/:id',function(req,res,next){
    Img.ImgDel(req.param('token'),req.params.id,function(data){
        if(data.success){
            res.json(data);
        }else{
            res.json(data);
        }
    })
});

router.delete('/posts/:id',function(req,res){
    var token=req.body.token;
    var postId=req.params.id;
    Posts.DelPost({token:token,id:postId},function(data){
        res.json(data);
    })
});

router.get('/posts',function(req,res){
    var token=req.param('token');
    Posts.ListPost({token:token},function(data){
        res.json(data);
    })
});

module.exports = router;