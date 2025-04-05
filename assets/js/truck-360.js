(function($) {
    'use strict';
    
    // Add debugging helper
    function debug(msg, data) {
        console.log('[Truck 360]', msg, data || '');
    }
    
    // 360 Viewer functionality
    $.fn.ThreeSixty = function(options) {
        debug('Initializing ThreeSixty');
        
        // Default settings
        var settings = $.extend({
            totalFrames: 18,
            currentFrame: 1,
            endFrame: 18,
            framerate: 60,
            fileFormat: 'jpg',
            playSpeed: 100,
            dragging: false,
            ready: false,
            imgList: '.three-sixty-image-holder img',
            imgArray: [],
            speed: 100,
            dragSpeed: 6,
            showCursor: false
        }, options);
        
        var base = this;
        
        // Initialize
        base.init = function() {
            debug('Init called');
            base.data('settings', settings);
            
            // Get all images
            var images = base.find(settings.imgList);
            debug('Found images:', images.length);
            
            if (images.length > 0) {
                images.each(function(index) {
                    settings.imgArray.push($(this));
                });
                
                // Set the first frame visible
                if (settings.imgArray.length > 0) {
                    settings.imgArray[0].css('display', 'block');
                    debug('First frame set visible');
                }
                
                // Set ready state
                settings.ready = true;
                
                // Hide loader
                $('.js-360-loader').fadeOut();
                
                // Set up event listeners for mouse
                base.on('mousedown', function(e) {
                    debug('Mouse down detected');
                    e.preventDefault();
                    settings.dragging = true;
                    settings.startX = e.pageX;
                    settings.currentX = settings.startX;
                });
                
                // Set up event listeners for touch separately
                base.on('touchstart', function(e) {
                    debug('Touch start detected');
                    e.preventDefault();
                    settings.dragging = true;
                    if (e.originalEvent && e.originalEvent.touches) {
                        settings.startX = e.originalEvent.touches[0].pageX;
                        settings.currentX = settings.startX;
                    }
                });
                
                // Handle document mouseup/touchend
                $(document).on('mouseup touchend', function(e) {
                    if (settings.dragging) {
                        debug('Drag ended');
                        e.preventDefault();
                        settings.dragging = false;
                    }
                });
                
                // Handle mouse movement separately
                $(document).on('mousemove', function(e) {
                    if (settings.dragging) {
                        debug('Mouse dragging');
                        e.preventDefault();
                        var x = e.pageX;
                        handleDrag(x);
                    }
                });
                
                // Handle touch movement separately
                $(document).on('touchmove', function(e) {
                    if (settings.dragging) {
                        debug('Touch dragging');
                        e.preventDefault();
                        if (e.originalEvent && e.originalEvent.touches) {
                            var x = e.originalEvent.touches[0].pageX;
                            handleDrag(x);
                        }
                    }
                });
                
                // Helper function for drag movement
                function handleDrag(x) {
                    // Calculate drag direction and speed
                    var deltaX = x - settings.currentX;
                    debug('Drag delta:', deltaX);
                    settings.currentX = x;
                    
                    // Update frame based on drag
                    if (deltaX > 0) {
                        settings.currentFrame -= 1;
                        if (settings.currentFrame < 1) {
                            settings.currentFrame = settings.totalFrames;
                        }
                    } else {
                        settings.currentFrame += 1;
                        if (settings.currentFrame > settings.totalFrames) {
                            settings.currentFrame = 1;
                        }
                    }
                    
                    debug('Current frame:', settings.currentFrame);
                    base.refresh();
                }
            }
        };
        
        // Refresh the display
        base.refresh = function() {
            if (settings.ready && settings.imgArray.length > 0) {
                // Hide all frames
                settings.imgArray.forEach(function(img) {
                    img.css('display', 'none');
                });
                
                // Show current frame
                var frameIndex = settings.currentFrame - 1;
                if (frameIndex >= 0 && frameIndex < settings.imgArray.length) {
                    settings.imgArray[frameIndex].css('display', 'block');
                    debug('Showing frame:', frameIndex + 1);
                }
            }
        };
        
        // Initialize
        base.init();
        
        return this;
    };
    
    // Document ready with jQuery dependency check
    $(function() {
        debug('Document ready');
        
        // Make sure jQuery is loaded completely
        if (typeof $ !== 'undefined') {
            // Initialize 360 viewer
            if ($('#preview-360').length > 0) {
                debug('Found #preview-360 element');
                $('#preview-360').ThreeSixty({
                    totalFrames: 18,
                    endFrame: 18,
                    currentFrame: 1
                });
            } else {
                debug('ERROR: #preview-360 element not found');
            }
            
            // Handle file uploads
            $('#btn-preview-sides').on('click', function(e) {
                debug('Upload sides button clicked');
                e.preventDefault();
                $('#preview_file_sides').trigger('click');
            });
            
            $('#btn-preview-back').on('click', function(e) {
                debug('Upload back button clicked');
                e.preventDefault();
                $('#preview_file_back').trigger('click');
            });
            
            // Handle file selection
            $('#preview_file_sides, #preview_file_back').on('change', function() {
                var file = this.files[0];
                if (!file) {
                    debug('No file selected');
                    return;
                }
                
                debug('File selected:', file.name);
                var side = $(this).attr('id').includes('sides') ? 'sides' : 'back';
                
                // Check file size
                if (file.size > 5 * 1024 * 1024) {
                    alert('File size must be less than 5MB');
                    return;
                }
                
                // Show loader
                $('.js-360-loader').fadeIn();
                
                // Create form data
                var formData = new FormData();
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
                            // Apply uploaded image to the appropriate truck sides
                            var frameIndices = [];
                            
                            if (side === 'sides') {
                                // Apply to side views (frames 4-8 and 12-16)
                                frameIndices = [4, 5, 6, 7, 8, 12, 13, 14, 15, 16];
                            } else {
                                // Apply to back views (frames 9, 10, 11)
                                frameIndices = [9, 10, 11];
                            }
                            
                            debug('Updating frames:', frameIndices.join(', '));
                            frameIndices.forEach(function(index) {
                                // Adjust for zero-based array
                                var imgElement = $('#preview-360').find('img').eq(index - 1);
                                if (imgElement.length > 0) {
                                    debug('Found image element for frame ' + index);
                                    // Create a new image to preload
                                    var tempImg = new Image();
                                    tempImg.onload = function() {
                                        // Once loaded, update the src
                                        debug('Image loaded, updating src for frame ' + index);
                                        imgElement.attr('src', response.data.url + '?t=' + new Date().getTime());
                                    };
                                    tempImg.onerror = function() {
                                        debug('Failed to load image for frame ' + index);
                                    };
                                    tempImg.src = response.data.url + '?t=' + new Date().getTime();
                                } else {
                                    debug('ERROR: Image element not found for frame ' + index);
                                }
                            });
                            
                            // Hide loader
                            $('.js-360-loader').fadeOut();
                        } else {
                            debug('AJAX returned error:', response.data ? response.data.message : 'Unknown error');
                            alert(response.data && response.data.message ? response.data.message : 'Upload failed. Please try again.');
                            $('.js-360-loader').fadeOut();
                        }
                    },
                    error: function(xhr, status, error) {
                        debug('AJAX error:', error);
                        debug('Status:', status);
                        debug('Response:', xhr.responseText);
                        alert('Upload failed. Please try again.');
                        $('.js-360-loader').fadeOut();
                    }
                });
            });
        } else {
            debug('ERROR: jQuery is not loaded properly');
        }
    });
})(jQuery);