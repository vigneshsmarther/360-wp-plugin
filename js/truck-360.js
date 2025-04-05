(function($) {
    'use strict';
    
    // 360 Viewer functionality
    $.fn.ThreeSixty = function(options) {
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
            base.data('settings', settings);
            
            // Get all images
            base.find(settings.imgList).each(function(index) {
                settings.imgArray.push($(this));
            });
            
            // Set the first frame visible
            settings.imgArray[0].css('display', 'block');
            
            // Set ready state
            settings.ready = true;
            
            // Hide loader
            $('.js-360-loader').fadeOut();
            
            // Set up event listeners
            base.on('mousedown touchstart', function(e) {
                e.preventDefault();
                settings.dragging = true;
                settings.startX = e.pageX || e.originalEvent.touches[0].pageX;
                settings.currentX = settings.startX;
            });
            
            $(document).on('mouseup touchend', function(e) {
                e.preventDefault();
                settings.dragging = false;
            });
            
            $(document).on('mousemove touchmove', function(e) {
                if (settings.dragging) {
                    e.preventDefault();
                    var x = e.pageX || e.originalEvent.touches[0].pageX;
                    
                    // Calculate drag direction and speed
                    var deltaX = x - settings.currentX;
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
                    
                    base.refresh();
                }
            });
        };
        
        // Refresh the display
        base.refresh = function() {
            if (settings.ready) {
                // Hide all frames
                settings.imgArray.forEach(function(img) {
                    img.css('display', 'none');
                });
                
                // Show current frame
                settings.imgArray[settings.currentFrame - 1].css('display', 'block');
            }
        };
        
        // Initialize
        base.init();
        
        return this;
    };
    
    // Document ready
    $(document).ready(function() {
        // Initialize 360 viewer
        $('#preview-360').ThreeSixty({
            totalFrames: 18,
            endFrame: 18,
            currentFrame: 1
        });
        
        // Handle file uploads
        $('#btn-preview-sides').on('click', function(e) {
            e.preventDefault();
            $('#preview_file_sides').click();
        });
        
        $('#btn-preview-back').on('click', function(e) {
            e.preventDefault();
            $('#preview_file_back').click();
        });
        
        // Handle file selection
        $('#preview_file_sides, #preview_file_back').on('change', function() {
            var file = this.files[0];
            var side = $(this).attr('id').includes('sides') ? 'sides' : 'back';
            
            if (file) {
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
                
                // Send Ajax request
                $.ajax({
                    url: truck360_ajax.ajax_url,
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function(response) {
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
                            
                            frameIndices.forEach(function(index) {
                                // Adjust for zero-based array
                                var imgElement = $('#preview-360').find('img').eq(index - 1);
                                
                                // Create a new image to preload
                                var tempImg = new Image();
                                tempImg.onload = function() {
                                    // Once loaded, update the src
                                    imgElement.attr('src', response.data.url);
                                };
                                tempImg.src = response.data.url;
                            });
                            
                            // Hide loader
                            $('.js-360-loader').fadeOut();
                        } else {
                            alert(response.data.message);
                            $('.js-360-loader').fadeOut();
                        }
                    },
                    error: function() {
                        alert('Upload failed. Please try again.');
                        $('.js-360-loader').fadeOut();
                    }
                });
            }
        });
    });
})(jQuery);