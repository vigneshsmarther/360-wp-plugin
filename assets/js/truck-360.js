(function($) {
    'use strict';
    
    // Add debugging helper
    function debug(msg, data) {
        console.log('[Truck 360]', msg, data || '');
    }
    
    // Class for 360 Viewer functionality
    class ThreeSixtyViewer {
        constructor(element, options) {
            this.element = $(element);
            this.settings = $.extend({
                totalFrames: 18,
                currentFrame: 1,
                imgArray: [],
                dragging: false,
                imageDir: '',
                imageFormat: 'jpg'
            }, options);
            
            this.init();
        }
        
        init() {
            debug('Initializing ThreeSixty Viewer');
            
            // Find all images
            const images = this.element.find('img');
            debug('Found images:', images.length);
            
            // Store images in array
            if (images.length > 0) {
                images.each((index, img) => {
                    this.settings.imgArray.push($(img));
                });
                
                // Show first frame
                if (this.settings.imgArray.length > 0) {
                    this.settings.imgArray.forEach(img => img.css('display', 'none'));
                    this.settings.imgArray[0].css('display', 'block');
                    debug('First frame set visible');
                }
                
                // Set up event listeners
                this.setupEventListeners();
            }
        }
        
        setupEventListeners() {
            // Mouse events
            this.element.on('mousedown touchstart', (e) => {
                e.preventDefault();
                this.settings.dragging = true;
                this.settings.startX = e.type === 'mousedown' ? e.pageX : e.originalEvent.touches[0].pageX;
                this.settings.currentX = this.settings.startX;
                this.element.css('cursor', 'grabbing');
            });
            
            $(document).on('mouseup touchend', (e) => {
                if (this.settings.dragging) {
                    e.preventDefault();
                    this.settings.dragging = false;
                    this.element.css('cursor', 'grab');
                }
            });
            
            $(document).on('mousemove touchmove', (e) => {
                if (this.settings.dragging) {
                    e.preventDefault();
                    const x = e.type === 'mousemove' ? e.pageX : e.originalEvent.touches[0].pageX;
                    this.handleDrag(x);
                }
            });
        }
        
        handleDrag(x) {
            // Calculate drag direction and frame movement
            const deltaX = x - this.settings.currentX;
            this.settings.currentX = x;
            
            // Update frame based on drag direction
            if (Math.abs(deltaX) > 5) { // Add threshold to prevent tiny movements causing frame changes
                if (deltaX > 0) {
                    // Moving right - show previous frame
                    this.settings.currentFrame -= 1;
                    if (this.settings.currentFrame < 1) {
                        this.settings.currentFrame = this.settings.totalFrames;
                    }
                } else {
                    // Moving left - show next frame
                    this.settings.currentFrame += 1;
                    if (this.settings.currentFrame > this.settings.totalFrames) {
                        this.settings.currentFrame = 1;
                    }
                }
                
                debug('Current frame:', this.settings.currentFrame);
                this.showFrame(this.settings.currentFrame);
            }
        }
        
        showFrame(frameNumber) {
            const index = frameNumber - 1;
            if (index >= 0 && index < this.settings.imgArray.length) {
                // Hide all frames
                this.settings.imgArray.forEach(img => img.css('display', 'none'));
                
                // Show requested frame
                this.settings.imgArray[index].css('display', 'block');
                debug('Showing frame:', frameNumber);
            }
        }
        
        updateImage(frameIndex, imageUrl) {
            debug('Updating image for frame:', frameIndex);
            
            if (frameIndex > 0 && frameIndex <= this.settings.imgArray.length) {
                const img = this.settings.imgArray[frameIndex - 1];
                
                // Create new image to preload
                const tempImg = new Image();
                tempImg.onload = () => {
                    debug('Image loaded for frame ' + frameIndex);
                    img.attr('src', imageUrl + '?t=' + new Date().getTime());
                };
                tempImg.src = imageUrl + '?t=' + new Date().getTime();
            }
        }
    }
    
    // Document ready
    $(function() {
        debug('Document ready');
        
        let viewer = null;
        
        // Initialize viewer if element exists
        if ($('#preview-360').length) {
            debug('Found #preview-360 element');
            const element = $('#preview-360');
            
            viewer = new ThreeSixtyViewer(element, {
                totalFrames: parseInt(element.data('imgcount')) || 18,
                currentFrame: 1,
                imageDir: element.data('url') || '',
                imageFormat: element.data('imgformat') || 'jpg'
            });
            
            // Add to window for debugging
            window.truckViewer = viewer;
            
            // Initialize buttons
            setupUploadButtons(viewer);
        } else {
            debug('ERROR: #preview-360 element not found');
        }
    });
    
    function setupUploadButtons(viewer) {
        debug('Setting up upload buttons');
        
        // Handle button clicks
        $('#btn-preview-sides').on('click', function(e) {
            debug('Upload sides button clicked');
            e.preventDefault();
            $('#preview_file_sides').val('').trigger('click');
        });
        
        $('#btn-preview-back').on('click', function(e) {
            debug('Upload back button clicked');
            e.preventDefault();
            $('#preview_file_back').val('').trigger('click');
        });
        
        // Handle file selection
        $('#preview_file_sides, #preview_file_back').on('change', function() {
            const file = this.files[0];
            if (!file) {
                debug('No file selected');
                return;
            }
            
            debug('File selected:', file.name);
            const side = $(this).attr('id').includes('sides') ? 'sides' : 'back';
            
            // Check file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                alert('Please select image file (JPG, PNG, GIF or WEBP)');
                return;
            }
            
            // Check file size
            if (file.size > 5 * 1024 * 1024) {
                alert('Max file size is 5MB');
                return;
            }
            
            // Show loader
            $('.js-360-loader').addClass('show');
            
            // Create form data
            const formData = new FormData();
            formData.append('action', 'truck_360_upload');
            formData.append('nonce', truck360_ajax.nonce);
            formData.append('file', file);
            formData.append('side', side);
            
            debug('Sending AJAX request');
            
            // Send Ajax request
            $.ajax({
                url: truck360_ajax.ajax_url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    debug('AJAX success:', response);
                    
                    if (response.success) {
                        // Determine frames to update
                        let frameIndices = [];
                        
                        if (side === 'sides') {
                            // Update side views (frames 4-8 and 12-16)
                            frameIndices = [4, 5, 6, 7, 8, 12, 13, 14, 15, 16];
                        } else {
                            // Update back views (frames 9, 10, 11)
                            frameIndices = [9, 10, 11];
                        }
                        
                        debug('Updating frames:', frameIndices.join(', '));
                        
                        // Update each frame
                        frameIndices.forEach(function(index) {
                            if (viewer) {
                                viewer.updateImage(index, response.data.url);
                            }
                        });
                    } else {
                        debug('AJAX error:', response.data?.message || 'Unknown error');
                        alert(response.data?.message || 'Upload failed. Please try again.');
                    }
                    
                    // Hide loader
                    $('.js-360-loader').removeClass('show');
                },
                error: function(xhr, status, error) {
                    debug('AJAX error:', error);
                    debug('Status:', status);
                    alert('Upload failed. Please try again.');
                    $('.js-360-loader').removeClass('show');
                }
            });
        });
    }
})(jQuery);
