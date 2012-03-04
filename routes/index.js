 var format = require('util').format;
 var im = require('imagemagick');
 var fs = require('fs');
 var path = require('path');
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Uploader' })
};

exports.upload = function(req, res) {

	var moveFile = function(name, tmpPath, id) {

		var dstDir = path.normalize( __dirname + '/../public/uploads' );
		var ext = path.extname(name);
		var id = (id) ? id : Math.floor(Math.random() * 1000);
		var dstPath = dstDir + '/file-' + id + ext
		var thumbPath = dstDir + '/thumb-file-' + id + ext

		fs.rename(tmpPath, dstPath, function() {
			// remove temp file
			fs.unlink(tmpPath);
			// remove already existing thumbnail
			fs.unlink(thumbPath);
		});
		return dstPath;
	}

	var fileId = (typeof req.body.fileId !== "undefined" && req.body.fileId !== null ? req.body.fileId : void 0)
	var imgPath = moveFile(req.files.upload.name, req.files.upload.path, fileId);

	var imgFileName = path.basename(imgPath);

	// the uploaded file can be found as `req.files.upload`
	var result, log;
	result = {
		file:	imgFileName,
		size:	req.files.upload.size / 1024 | 0,
		type: 	req.files.upload.type,
		params:	req.body // Handling extra parameters
	};
	
	log = format('\nuploaded %s (%d Kb, %s) to %s', result.name, result.size, result.type , imgPath);
	console.log(log);


	if (req.xhr) {

		// uncomment the following line to simulate network latency for localhost testing
		//setTimeout(function(){ res.json(result); }, 3000);
		res.json(result);

	} else if(req.query.iframe){

		res.render('upload-iframe', {
			layout: false,
			locals:{ 
				callback: req.query.iframe,
				result: JSON.stringify(result)
			}
		});
	}
	else {
		res.render('upload', { 
			title: 'Uploader', 
			file: imgFileName
		});
	}
};

exports.thumb = function(req, res) {

	console.log('getting thumbnail for', req.params.file);

	var srcPath = path.normalize( __dirname + '/../public/uploads/' + req.params.file );
	var dstPath = path.normalize( __dirname + '/../public/uploads/thumb-' + req.params.file );

	path.exists(dstPath, function(exists) {

		// thumbnail already exists
	    if (exists) {
	    	console.log('thumb already exists. sending file');
			res.contentType(dstPath);
	        res.sendfile(dstPath);
	    }
	    // Generate Thumbnail
	    else {
	    	console.log('thumb does not exists. generating file');
	        
			im.resize({
				srcPath: srcPath,
				dstPath: dstPath,
				width: 70
			}, function(err, stdout, stderr){
				if (err) throw err;
				res.contentType(dstPath);
		        res.sendfile(dstPath);
			});
	    }
	});
};

exports.remove = function(req, res, next) {

	var file = req.body.file;
	if (file) {

		var dstDir = path.normalize( __dirname + '/../public/uploads' );
		var ext = path.extname(file);
		var dstPath = path.join(dstDir, file);
		var thumbPath = path.join(dstDir, '/thumb-'+file);

		console.log('removing', file);
		// remove img file
		fs.unlink(dstPath);
		// remove already existing thumbnail
		fs.unlink(thumbPath);

		if (req.xhr) {
			res.send({
				file: file,
				status: 'deleted'
			});	
		}
		else {	
			res.redirect('home');	
		}
		res.end();
	}
	else next();
}
