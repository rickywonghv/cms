/**
 * Created by damon on 6/13/16.
 */
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.render('admin',{title:"Admin"})
});

router.get('/post', function(req, res, next) {
    res.render('post',{title:"Admin"})
});

module.exports = router;
