//Utility functions to be used in API.
var fs = require('fs'),
    request = require('request'),
    embedly = require('embedly'),
    im = require('imagemagick'),
    htmlToText = require('html-to-text'),
    giphy = require( 'giphy' )(process.env.GIPHY_KEY),
    aws = require('aws-sdk'),
    Uploader = require('s3-streaming-upload').Uploader,
     _ = require('lodash');
//UUID
const { v4: uuidv4 } = require('uuid');
//Filter for badwords
var Filter = require('bad-words'),
    filter = new Filter();
//Get text summary
var get_text_summary = function(html){
    //Get summary
    var summary_text = htmlToText.fromString(html, {
        ignoreImage: true,
        ignoreHref: true,
        preserveNewlines: true,
        wordwrap: null
    });
    summary_text = summary_text.substring(0, 600);
    summary_text = summary_text.replace(/(?:\r\n|\r|\n)/g, '<br />');
    return summary_text;
};
//Get only text
var get_only_text = function(html){
    var summary_text = htmlToText.fromString(html, {
        ignoreImage: true,
        ignoreHref: true,
        preserveNewlines: true,
        wordwrap: null
    });
    return summary_text;
};
//Extract link data using embedly
var get_link_metadata = function(link, callback){
    var EMBEDLY_KEY = process.env.EMBEDLY_KEY;
    var api = new embedly({key: EMBEDLY_KEY});
    api.extract({url: link}, function(err, objs){
        if(!!err) return;
        var link_data = objs[0];
        callback(link_data);
    });
};
//Resize image
var get_resized_image = function(file_name, url, resizelength, callback){
    var key = uuidv4();
    var original = url;
    var resized = '/tmp/' + key + '_' + file_name + '_resized.png';
    im.resize({srcPath: original, dstPath: resized, width: resizelength}, function(err, stdout, stderr){
        if(err){
            fs.unlink(resized, function(err){});
            return '';
        }
        //Unlink original as we are only using resized to upload
        fs.unlink(original, function(err){});
        callback(resized);
    });
};
//Resize and crop image
var get_cropped_image = function(file_name, url, width, height, callback){
    var key = uuidv4();
    var original = url;
    var cropped = '/tmp/' + key + '_' + file_name + '_cropped.png';
    im.crop({srcPath: original, dstPath: cropped, width: width, height: height, gravity: 'North'}, function(err, stdout, stderr){
        if(err){
            fs.unlink(cropped, function(err){});
            return '';
        }
        //Unlink original as we are only using cropped to upload.
        fs.unlink(original, function(err){});
        callback(cropped);
    });
};
//Upload file
var upload_file = function(file, file_name, callback){
    var key = uuidv4();
    var upload = new Uploader({
        accessKey: process.env.AWS_KEY,
        secretKey: process.env.AWS_SECRET,
        bucket: process.env.AWS_BUCKET,
        objectName: process.env.THUMB_DIR + key + '_' + file_name + '.png',
        stream: fs.createReadStream(file),
        objectParams: {
            ACL: 'public-read'
        }
    });
    upload.send(function(err){
        if(!err){
            fs.unlink(file, function(err){});
            callback('https://'+ process.env.CLOUDFRONT +'/'+ process.env.THUMB_DIR + key + '_' + file_name + '.png');
        } else {
            callback('');
        }
    });
};
//Download file from URL
var download_file = function(url, file_name, callback){
    var key = uuidv4();
    var file = '/tmp/' + key + '_' + file_name + '.png';
    request.head(url, function(err, res, body){
        var stream = request(url).pipe(fs.createWriteStream(file));
        stream.on('close', function(){
            callback(file);
        });
    });
};
//Get provider key from provider
var get_provider_key = function(provider, image){
    var key;
    if(provider && provider.name == 'FramerSpace' && provider.url != image){
        key = {Key: decodeURIComponent(provider.url.split('https://'+ process.env.CLOUDFRONT +'/')[1])};
    }
    return key;
};
//Get keys from images
var get_image_keys = function(images, thumbnail){
    var keys = [];
    if(images && images.length) {
        for(var i=0; i< images.length; ++i){
            if(images[i] && images[i].indexOf('https://'+ process.env.CLOUDFRONT +'/') > -1){
                keys.push({Key: decodeURIComponent(images[i].split('https://'+ process.env.CLOUDFRONT +'/')[1])});
            } else if(images[i] && images[i].indexOf('https://'+ process.env.AWS_BUCKET +'.s3.amazonaws.com/') > -1){
                keys.push({Key: decodeURIComponent(images[i].split('https://'+ process.env.AWS_BUCKET +'.s3.amazonaws.com/')[1])});
            }
        }
    }
    if(thumbnail && thumbnail.indexOf('https://'+ process.env.CLOUDFRONT +'/') > -1) {
        keys.push({Key: decodeURIComponent(thumbnail.split('https://'+ process.env.CLOUDFRONT +'/')[1])});
    } else if(thumbnail && thumbnail.indexOf('https://'+ process.env.AWS_BUCKET +'.s3.amazonaws.com/') > -1){
        keys.push({Key: decodeURIComponent(thumbnail.split('https://'+ process.env.AWS_BUCKET +'.s3.amazonaws.com/')[1])});
    }
    return keys;
};
//Delete all s3 image keys
var delete_keys = function(keys){
    if(keys && keys.length){
        //Delete s3 objects
        var s3 = new aws.S3();
        s3.deleteObjects({
            Bucket: process.env.AWS_BUCKET,
            Delete: {
                Objects: keys
            }
        }, function(err, data){});
    }
};
//Get gifs
var get_gifs_results = function(search_text, callback){
    giphy.search({q : search_text, rating: 'g'}, function(err, data){
        callback(data);
    });
};
//Get filtered text
var get_filtered_text = function(text){
    var filtered_text = filter.clean(text);
    return filtered_text;
};
//Get sorted blocks
var get_sorted_blocks = function(blocks, callback){
    function getNestedChildren(arr, parent) {
        var out = []
        for(var i in arr) {
            if((arr[i].container == parent) || (arr[i].container && arr[i].container.toString() == parent)) {
                if(arr[i].type == 'container'){
                    var children = getNestedChildren(arr, arr[i]._id.toString());
                    if(children.length) {
                        arr[i].children = children;
                    }
                }
                out.push(arr[i]);
            }
        }
        return out;
    }
    var sorted_blocks = getNestedChildren(blocks, null);
    callback(sorted_blocks);
};
//Export all functions
module.exports.get_text_summary = get_text_summary;
module.exports.get_only_text = get_only_text;
module.exports.get_link_metadata = get_link_metadata;
module.exports.get_resized_image = get_resized_image;
module.exports.get_cropped_image = get_cropped_image;
module.exports.upload_file = upload_file;
module.exports.download_file = download_file;
module.exports.get_provider_key = get_provider_key;
module.exports.get_image_keys = get_image_keys;
module.exports.delete_keys = delete_keys;
module.exports.get_gifs_results = get_gifs_results;
module.exports.get_filtered_text = get_filtered_text;
module.exports.get_sorted_blocks = get_sorted_blocks;
