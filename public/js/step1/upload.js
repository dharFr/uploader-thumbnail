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

				// old-school iframe method
				this.prepareIframeUpload();
				return true; // submit the form
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

		onUploadDone: function(data) {

			// reset upload field
			this.$upload.val('');

			// saving data
			this.data = data;
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
