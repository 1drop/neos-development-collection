define(
[
	'emberjs',
	'text!./FileUpload.html',
	'../../Components/Button',
	'Library/plupload'
],
function(Ember, template, Button, plupload) {
	return Ember.View.extend({

		value: '',

		/**
		 * Label of the file chooser button
		 */
		fileChooserLabel: 'Choose file',
		uploaderLabel: 'Upload',
		cropLabel: 'Crop',

		// File filters
		allowedFileTypes: null,

		_uploader: null,
		_uploadInProgress: false,
		_containerId: null,
		_browseButtonId: null,
		_uploadButtonShown: false,
		_uploadButtonNotShown: function() {
			return !this.get('_uploadButtonShown');
		}.property('_uploadButtonShown'),

		template: Ember.Handlebars.compile(template),
		Button: Button,

		init: function() {
			var id = this.get(Ember.GUID_KEY);
			this._containerId = 'typo3-fileupload' + id;
			this._browseButtonId = 'typo3-fileupload-browsebutton' + id;
			return this._super();
		},

		didInsertElement: function() {
			this._initializeUploader();
		},

		_initializeUploader: function() {
			var that = this;
			this._uploader = new plupload.Uploader({
				runtimes : 'html5',
				browse_button : this._browseButtonId,
				container : this._containerId,
				max_file_size : '10mb',
				url : '/neos/content/uploadImage',
				multipart_params: {}
			});
			if (this.allowedFileTypes) {
				this._uploader.settings.filters = [{
					title: 'Allowed files',
					extensions: this.allowedFileTypes
				}];
			}

			this._uploader.bind('FilesAdded', function(uploader, files) {
				if (files.length > 0) {
					that.set('_uploadButtonShown', true);
				} else {
					that.set('_uploadButtonShown', false);
				}
			});

			this._uploader.bind('Error', function(uploader, error) {
				that.set('_uploadInProgress', false);
				T3.Common.Notification.error(error.message);
				// FilesAdded gets the unfiltered list, so we have to disable the upload on errors
				if (error.code === plupload.FILE_EXTENSION_ERROR) {
					that.set('_uploadButtonShown', false);
				}
			});

			this._uploader.bind('BeforeUpload', function(uploader, file) {
				uploader.settings.multipart_params['image[type]'] = 'plupload';
				uploader.settings.multipart_params['image[fileName]'] = file.name;
			});

			this._uploader.bind('FileUploaded', function(uploader, file, response) {
				T3.Common.Notification.ok('Uploaded file "' + file.name + '".');
				that.fileUploaded(response.response);
			});

			this._uploader.init();
			this._uploaderInitialized();
		},
		_uploaderInitialized: function() {
			var that = this;
			this.$().find('input[type=file][id^="' + this._uploader.id + '"]').change(function(event) {
				that.filesScheduledForUpload(event.target.files);
			});
		},
		// The "files" is taken from the DOM event when a file changes
		filesScheduledForUpload: function(files) {
			// Template method
		},
		fileUploaded: function(response) {
			this.set('_uploadInProgress', false);
			this.set('_uploadButtonShown', false);
		},
		upload: function() {
			this.set('_uploadInProgress', true);
			this._uploader.start();
		}
	});
});