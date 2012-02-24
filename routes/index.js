 var format = require('util').format;
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Uploader' })
};

exports.upload = function(req, res) {
	// the uploaded file can be found as `req.files.upload`
	var result, log;
	result = {
		name:	req.files.upload.name,
		size:	req.files.upload.size / 1024 | 0,
		type: 	req.files.upload.type
	};
	log = format('\nuploaded %s (%d Kb, %s) to %s'
	    , result.name
	    , result.size
	    , result.type 
	    , req.files.upload.path);

	console.log(log);

	if(req.query.iframe){

		res.render('upload-iframe', {
			layout: false,
			locals:{ 
				callback: req.query.iframe,
				result: JSON.stringify(result)
			}
		});
	}
	else {
		res.render('upload', { title: 'Uploader', content: log });	
	}
};