<?php
/**
 * Improved upload handler function for the Truck 360 Preview plugin.
 * Replace this function in your truck-360-preview.php file.
 */

public function handle_upload() {
    // Set content type to JSON
    header('Content-Type: application/json');
    
    // Add debugging
    error_log('Truck 360: Upload handler started');
    
    // Verify nonce
    if (!check_ajax_referer('truck_360_nonce', 'nonce', false)) {
        error_log('Truck 360: Nonce verification failed');
        wp_send_json_error(array('message' => 'Security check failed'));
        return;
    }
    
    // Check if file was uploaded
    if (!isset($_FILES['file']) || !isset($_FILES['file']['tmp_name']) || empty($_FILES['file']['tmp_name'])) {
        error_log('Truck 360: No file uploaded');
        wp_send_json_error(array('message' => 'No file was uploaded'));
        return;
    }
    
    // Check file size
    if ($_FILES['file']['size'] > 5 * 1024 * 1024) {
        error_log('Truck 360: File too large: ' . $_FILES['file']['size'] . ' bytes');
        wp_send_json_error(array('message' => 'File size must be less than 5MB'));
        return;
    }
    
    // Check file type
    $allowed_types = array('image/jpeg', 'image/png', 'image/gif');
    if (!in_array($_FILES['file']['type'], $allowed_types)) {
        error_log('Truck 360: Invalid file type: ' . $_FILES['file']['type']);
        wp_send_json_error(array('message' => 'Only JPG, PNG, and GIF files are allowed'));
        return;
    }
    
    // Get upload directory
    $upload_dir = wp_upload_dir();
    $upload_path = $upload_dir['path'] . '/';
    $upload_url = $upload_dir['url'] . '/';
    
    error_log('Truck 360: Upload path: ' . $upload_path);
    
    // Make sure the upload directory exists
    if (!file_exists($upload_path)) {
        if (!wp_mkdir_p($upload_path)) {
            error_log('Truck 360: Failed to create upload directory');
            wp_send_json_error(array('message' => 'Failed to create upload directory'));
            return;
        }
    }
    
    // Generate unique filename with timestamp to avoid caching issues
    $filename = 'truck360_' . time() . '_' . wp_unique_filename($upload_path, $_FILES['file']['name']);
    error_log('Truck 360: Generated filename: ' . $filename);
    
    // Move uploaded file
    $upload_file = $upload_path . $filename;
    
    if (move_uploaded_file($_FILES['file']['tmp_name'], $upload_file)) {
        // Success
        error_log('Truck 360: File uploaded successfully to: ' . $upload_file);
        
        // Get the uploaded file URL
        $file_url = $upload_url . $filename;
        
        // Get the side parameter
        $side = isset($_POST['side']) ? sanitize_text_field($_POST['side']) : '';
        
        error_log('Truck 360: Returning URL: ' . $file_url . ' for side: ' . $side);
        
        wp_send_json_success(array(
            'url' => $file_url,
            'side' => $side
        ));
    } else {
        // Error
        error_log('Truck 360: Failed to move uploaded file');
        wp_send_json_error(array('message' => 'Failed to upload file'));
    }
    
    wp_die();
}