;(function( $, window, document, undefined ){

	// our plugin constructor
	var Remover = function( form, options ){

		this.form = form;
		this.$form = $(form);

		this.options = options;
		this.metadata = this.$form.data( 'plugin-options' );

		this.obs = options.observer || {publish:function(){}, subscribe:function(){}};
	};

	// the Remover prototype
	Remover.prototype = {
		defaults: {},

		init: function() {
			// Introduce defaults that can be extended either 
			// globally or using an object literal. 
			this.config = $.extend({}, this.defaults, this.options, this.metadata);
			this.fileId = $('input[name="fileId"]').val() || this.config.fileId

			// Listen to 'uploaded' event to save file-name
			this.obs.subscribe('uploaded.uploader',	$.proxy(this.onUploadDone, this));

			this.$form.on('submit.uploader', $.proxy(function(){

				// If file isn't defined, nothing to remove
				if (this.file) {

					this.obs.publish('removing.remover', this.fileId);

					var jqXhr = $.ajax({
						url: this.$form.attr('action'),
						type: this.$form.attr('method'),
						data: {
							file: this.file
						}
					});

					jqXhr
						.fail(function(){
							console.log('delete file error:', arguments);
						})
						.done($.proxy(function(){
							// Notify Observer
							this.obs.publish('removed.remover', this.fileId);
						}, this));	
				}
				// prevent default
				return false;
			}, this));

			return this;
		},

		onUploadDone: function(fileId, data) {
			console.log('Remover:onUploadDone:', fileId, data);

			if (fileId === this.fileId) {
				this.file = data.file;
			}
		}

	}

	Remover.defaults = Remover.prototype.defaults;

	$.fn.remover = function(options) {
		return this.each(function() {
			new Remover(this, options).init();
		});
	};

	//optional: window.Remover = Remover;

})( jQuery, window , document );
