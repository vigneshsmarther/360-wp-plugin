<?php
/**
 * Plugin Name: Truck 360 Preview
 * Plugin URI: https://yourwebsite.com/truck-360-preview
 * Description: A WordPress plugin that enables 360-degree preview of trucks with custom side and back panel uploads.
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://yourwebsite.com
 * Text Domain: truck-360-preview
 * Domain Path: /languages
 * License: GPL v2 or later
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Truck_360_Preview {
    
    /**
     * Constructor
     */
    public function __construct() {
        // Register hooks
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_ajax_truck_360_upload', array($this, 'handle_upload'));
        add_action('wp_ajax_nopriv_truck_360_upload', array($this, 'handle_upload'));
        add_shortcode('truck_360_preview', array($this, 'render_shortcode'));
    }
    
    /**
     * Enqueue scripts and styles
     */
    public function enqueue_scripts() {
        wp_enqueue_style('truck-360-style', plugin_dir_url(__FILE__) . 'assets/css/truck-360.css', array(), '1.0.0');
        wp_enqueue_script('truck-360-script', plugin_dir_url(__FILE__) . 'assets/js/truck-360.js', array('jquery'), '1.0.0', true);
        
        // Pass ajax url to script
        wp_localize_script('truck-360-script', 'truck360_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('truck_360_nonce')
        ));
    }
    
    /**
     * Handle file upload via AJAX
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
    
    /**
     * Render the shortcode
     */
    public function render_shortcode($atts) {
        // Default attributes
        $atts = shortcode_atts(array(
            'title' => 'Truck 360° Preview',
            'description' => 'Upload your design to see how it looks on the truck from all angles.'
        ), $atts, 'truck_360_preview');
        
        // Start output buffering
        ob_start();
        
        // Include template file
        include plugin_dir_path(__FILE__) . 'templates/preview-template.php';
        
        // Return buffered content
        return ob_get_clean();
    }
}

// Initialize the plugin
new Truck_360_Preview();