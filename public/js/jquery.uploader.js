;(function( $, window, document, undefined ){

	// our plugin constructor
	var Uploader = function( form, options ){
		this.form = form;
		this.$form = $(form);
		this.$upload = $('input[type="file"]', this.form);

		this.obs = options.observer || {publish:function(){}, subscribe:function(){}};

		this.options = options;

		// This next line takes advantage of HTML5 data attributes
		// to support customization of the plugin on a per-element
		// basis. For example,
		// <form data-plugin-options='{"message":"Goodbye World!"}'></form>
		this.metadata = this.$form.data( 'plugin-options' );


		this.fileId = $('input[name="fileId"]').val() || this.metadata.fileId

		this.$remove = null;		// the remove UI that will be generated after uploading
		this.$message = null;		// 
		this.$fContent = null; 		// form content wrapped into this element
		this.id = null; 			// random id generated to identify iframe and callback
		this.data = null;			// file data returned by file upload
	};

	// the uploader prototype
	Uploader.prototype = {
		defaults: {
			loadingText:	"Uploading picture...",
			removeLabel:	"Don't like it?",
			removeBtnText:	"Remove file",
			onDragText:		"Drop file here!"
		},

		init: function() {
			// Introduce defaults that can be extended either 
			// globally or using an object literal. 
			this.config = $.extend({}, this.defaults, this.options, this.metadata);

			// Sample usage:
			// Set the message per instance:
			// $('#elem').uploader({ removeLabel: 'Delete File'});
			// or
			// var p = new Uploader(document.getElementById('elem'), 
			// { removeLabel: 'Delete File'}).init()
			// or, set the global default message:
			// Uploader.defaults.removeLabel = 'Delete File'

			this.hideSubmitBtn();
			this.wrapFormContent();

			this.$form.on('submit.uploader', $.proxy(function(){
				console.log('submit', this.$upload);

				var file = false
				if (this.$upload[0].files) file = this.$upload[0].files[0];

				this.onBeforeUpload(file);

				if (window.FormData && file ) {

					this.upload(file);
				}
				else {
					// fallback to old-school iframe method
					this.iframeUpload();
				}
				return false;
			}, this));

			// Handle Drag'n'Drop
			this.$form.on('dragenter.uploader', $.proxy(this.onDragEnter, this));
			this.$form.on('dragleave.uploader', $.proxy(this.onDragLeave, this));

			this.$form.on('dragover.uploader', function(e){
				return false;
			});
			this.$form.on('drop.uploader', $.proxy(this.onDrop, this));

			return this;
		},

		onBeforeUpload: function(file) {

			// Hide submit form
			this.showMessage(this.config.loadingText);

			// Notify Observer
			this.obs.publish('submit.uploader', this.fileId, file);
		},

		onDragEnter: function(e){

			this.showMessage(this.config.onDragText);

			// prevent default behaviour
			return false;
		},

		onDragLeave: function(e){

			this.hideMessage();

			// prevent default behaviour
			return false;
		},

		onDrop: function(e) {
			// prevent default behaviour
			e.preventDefault();
			e.stopPropagation();

			this.hideMessage();

			var file;
			if (e.originalEvent.dataTransfer && (file = e.originalEvent.dataTransfer.files[0])) {

				this.onBeforeUpload(file);
				this.upload(file);
			}

			return false;
		},

		// Hides submit button and bind form submit 
		// on the input file's 'change' event
		hideSubmitBtn: function() {

			$('input[type="submit"]', this.$form).hide();	
			this.$upload.on('change.uploader', $.proxy(function(){
				this.$form.submit();	
			}, this));
		},

		wrapFormContent: function() {

			if (!this.$fContent) {
				this.$form.wrapInner('<div class="uploader-form-content">');
				this.$fContent = $('.uploader-form-content', this.$form);
			}
		},

		showMessage: function(text) {

			// Hide form content
			this.$fContent.hide();


			if (!this.$message) {

				this.$message = $('<div class="uploader-loading">' + text + '</div>');
				$('input[type=button]', this.$remove).on('click.uploader', $.proxy(this.deleteFile, this));
			}
			else {
				this.$message.text(text);
			}
			this.$form.append(this.$message);			
		},

		hideMessage: function() {
			this.$message.detach();
			this.$fContent.show();
		},

		showRemoveButton: function() {

			// Hide form content
			this.$fContent.hide();

			if (!this.$remove) {

				this.$remove = $('<div class="uploader-remove">'
					+ '<label for="remove-'+this.id+'">'
					+ this.config.removeLabel
					+ '</label><br>'
					+ '<input type="button" id="remove-'+this.id+'" value="'+this.config.removeBtnText+'"/>'
					+ '</div>');

				$('input[type=button]', this.$remove).on('click.uploader', $.proxy(this.deleteFile, this));
			}
			this.$form.append(this.$remove);
		},

		hideRemoveButton: function() {
			this.$remove.detach();
			this.$fContent.show();
		},

		deleteFile: function() {
			console.log('ask for delete');
			var jqXhr = $.post(this.config.removeUrl, {
				file: this.data.file
			})

			jqXhr
				.fail(function(){
					console.log('delete file error:', arguments);
				})
				.done($.proxy(function(){
					this.hideRemoveButton();
					this.data = null;

					// Notify Observer
					this.obs.publish('removed.uploader', this.fileId);
				}, this));
		},

		onUploadDone: function(data) {

			console.log('onUploadDone:', data, this.fileId);
			// saving data
			this.data = data;

			// Update UI
			this.hideMessage();
			this.showRemoveButton();

			// Notify Observer
			this.obs.publish('uploaded.uploader', this.fileId, this.data);
		},

		upload: function(file) {
			console.log('FileReader supported and file is:', file);

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
		iframeUpload: function() {

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
		}
	}

	Uploader.defaults = Uploader.prototype.defaults;

	$.fn.uploader = function(options) {
		return this.each(function() {
			new Uploader(this, options).init();
		});
	};

	//optional: window.Uploader = Uploader;

})( jQuery, window , document );
