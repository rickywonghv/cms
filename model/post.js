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
    Admin.suOnly(json.token,function(data){
        next(data);
    });
};

module.exports.AddPost=AddPost;