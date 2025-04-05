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
        // Check nonce first
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'truck_360_nonce')) {
            wp_send_json_error(array('message' => 'Security check failed'));
            return;
        }
        
        // Check if file was uploaded
        if (!isset($_FILES['file']) || empty($_FILES['file']['tmp_name'])) {
            wp_send_json_error(array('message' => 'No file was uploaded'));
            return;
        }
        
        // Check file size
        if ($_FILES['file']['size'] > 5 * 1024 * 1024) {
            wp_send_json_error(array('message' => 'File size must be less than 5MB'));
            return;
        }
        
        // Check file type
        $allowed_types = array('image/jpeg', 'image/png', 'image/gif', 'image/webp');
        if (!in_array($_FILES['file']['type'], $allowed_types)) {
            wp_send_json_error(array('message' => 'Only JPG, PNG, GIF and WEBP files are allowed'));
            return;
        }
        
        // Get upload directory
        $upload_dir = wp_upload_dir();
        $upload_path = $upload_dir['path'] . '/';
        $upload_url = $upload_dir['url'] . '/';
        
        // Generate unique filename
        $filename = 'truck360_' . time() . '_' . wp_unique_filename($upload_path, $_FILES['file']['name']);
        
        // Move uploaded file
        $upload_file = $upload_path . $filename;
        
        if (move_uploaded_file($_FILES['file']['tmp_name'], $upload_file)) {
            // Success
            $file_url = $upload_url . $filename;
            $side = isset($_POST['side']) ? sanitize_text_field($_POST['side']) : '';
            
            wp_send_json_success(array(
                'url' => $file_url,
                'side' => $side
            ));
        } else {
            // Error
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
