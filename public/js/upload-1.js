(function(){

	/*
	 *
	 */
	var Uploader = function(formId) {

		this.form = $('#'+formId);
		this.upload = $('input[type="file"]', this.form);

		var self = this;
		this.form.submit(function(){

			// iframe method
			var unique, id, cb, iframe, url;
			
			unique = Math.floor(Math.random() * 1000);
			id = "uploader-frame-" + unique;
			cb = "uploader-cb-" + unique;

			// creating iframe
			iframe = $('<iframe id="'+id+'" name="'+id+'" style="display:none;">').appendTo(self.form);
			self.form.attr('target', id);

			// defining callback
			url = self.form.attr('action');
			self.form.attr('action', url + '?iframe=' + cb);
			
			window[cb] = function(data) {
				console.log('received callback:', data);

				// removing iframe
				iframe.remove();
				self.form.removeAttr('target');
				// removing callback
				self.form.attr('action', url);
				window[cb] = undefined;
			};
		});
	};


	window.Uploader = Uploader;
})();