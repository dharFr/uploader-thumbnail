;(function( $, window, document, undefined ){

	// our plugin constructor
	var Uploader = function( form, options ){

		this.form = form;
		this.$form = $(form);
		this.$upload = $('input[type="file"]', this.form);

		this.options = options;
		this.metadata = this.$form.data( 'plugin-options' );
	};

	// the Thumbnail prototype
	Uploader.prototype = {
		defaults: {},

		init: function() {
			// Introduce defaults that can be extended either 
			// globally or using an object literal. 
			this.config = $.extend({}, this.defaults, this.options, this.metadata);


			this.hideSubmitBtn();

			this.$form.on('submit.uploader', $.proxy(function(){

				var file = false
				if (this.$upload[0].files) file = this.$upload[0].files[0];

				this.beforeUpload(file);

				if (window.FormData && file ) {

					console.log('FormData supported and file is:', file);
					this.upload(file);
					return false;
				}
				// fallback to old-school iframe method
				else {
					console.log('FormData is not supported or file is undefined:', file);
					this.prepareIframeUpload();
					return true; // submit the form
				}

			}, this));

			return this;
		},

		// Hides submit button and bind form submit 
		// on the input file's 'change' event
		hideSubmitBtn: function() {

			$('input[type="submit"]', this.$form).hide();	
			this.$upload.on('change.uploader', $.proxy(function(){
				this.$form.submit();	
			}, this));
		},

		upload: function(file) {

			var formdata = new FormData(this.$form[0]);
			 
			if (formdata) {
				var jqXhr = $.ajax({
					url: this.$form.attr('action'),
					type: this.$form.attr('method'),
					data: formdata,
					processData: false,
					contentType: false
				});

				jqXhr
					.done($.proxy(this.onUploadDone, this))
					.fail(function(){
						console.log("upload error:", arguments);
					});
			}
		},

		// Faking AJAX post with iframe
		prepareIframeUpload: function() {

			var id, cb, iframe, url;
			
			// Generating a random id to identify
			// both the iframe and the callback function
			this.id = Math.floor(Math.random() * 1000);
			id = "uploader-frame-" + this.id;
			cb = "uploader-cb-" + this.id;

			// creating iframe and callback
			iframe = $('<iframe id="'+id+'" name="'+id+'" style="display:none;">');
			url = this.$form.attr('action');

			this.$form
				.attr('target', id)
				.append(iframe)
				.attr('action', url + '?iframe=' + cb);
			
			// defining callback
			window[cb] =  $.proxy(function(data) {
				console.log('received callback:', data);

				// removing iframe
				iframe.remove();
				this.$form.removeAttr('target');
				
				// removing callback
				this.$form.attr('action', url);
				window[cb] = undefined;

				this.onUploadDone(data);
			}, this);
		},

		beforeUpload: function(file) {

		},

		onUploadDone: function(data) {

			// reset upload field
			this.$upload.val('');

			// saving data
			this.data = data;
		},

		// Test from Modernizr: 
		// https://github.com/Modernizr/Modernizr/blob/master/modernizr.js#L528-531
		supportDragAndDrop: function() {

	        var div = document.createElement('div');
	        return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);    
		}
	}

	Uploader.defaults = Uploader.prototype.defaults;

	$.fn.uploader = function(options) {
		return this.each(function() {
			new Uploader(this, options).init();
		});
	};

	//optional: window.Thumbnail = Thumbnail;

})( jQuery, window , document );
