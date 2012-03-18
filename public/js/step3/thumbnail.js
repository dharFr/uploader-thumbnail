;(function( $, window, document, undefined ){

	// our plugin constructor
	var Thumbnail = function( elem, options ){

		this.elem = elem;
		this.$elem = $(elem);

		this.options = options;
		this.metadata = this.$elem.data( 'plugin-options' );

		this.obs = options.observer || {publish:function(){}, subscribe:function(){}};
	};

	// the Thumbnail prototype
	Thumbnail.prototype = {
		defaults: {},

		init: function() {
			// Introduce defaults that can be extended either 
			// globally or using an object literal. 
			this.config = $.extend({}, this.defaults, this.options, this.metadata);
			this.fileId = this.config.fileId

			// Observe uploader events
			this.obs.subscribe('submit.uploader', 	$.proxy(this.onUploadStart, this));
			this.obs.subscribe('uploaded.uploader',	$.proxy(this.onUploadDone, this));
			this.obs.subscribe('removed.remover',	$.proxy(this.onRemove, this));

			return this;
		},

		onUploadStart: function(fileId, file) {
			console.log('Thumbnail:onUploadStart:', fileId, file);

			if (fileId === this.fileId) {

				this.$elem.removeClass('empty').addClass('loading');
			}
		},

		onUploadDone: function(fileId, data) {
			console.log('Thumbnail:onUploadDone:', fileId, data);

			if (fileId === this.fileId) {

				this.$elem.removeClass('loading empty');

				$('<a href="/uploads/' + data.file + '">' +
					'<img src="/thumb/' + data.file + '">' + 
					'<figcaption>' + data.file +'</figcaption>' +
				'</a>').appendTo(this.$elem);
			}
		},

		onRemove: function(fileId) {
			console.log('Thumbnail:onRemove:', fileId);

			if (fileId === this.fileId) {

				this.$elem.removeClass('loading').addClass('empty');
				this.$elem.empty();
			}
		},

	}

	Thumbnail.defaults = Thumbnail.prototype.defaults;

	$.fn.thumbnail = function(options) {
		return this.each(function() {
			new Thumbnail(this, options).init();
		});
	};

	//optional: window.Thumbnail = Thumbnail;

})( jQuery, window , document );
