<?php
/**
 * Plugin Name: Truck 360 Preview
 * Description: A plugin that allows users to preview their campaigns on trucks with a 360° view
 * Version: 1.0
 * Author: Your Name
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Truck360Preview {
    
    public function __construct() {
        // Register scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'register_scripts'));
        
        // Register shortcode
        add_shortcode('truck_360_preview', array($this, 'truck_360_shortcode'));
        
        // Register Ajax handlers
        add_action('wp_ajax_truck_360_upload', array($this, 'handle_upload'));
        add_action('wp_ajax_nopriv_truck_360_upload', array($this, 'handle_upload'));
    }
    
    public function register_scripts() {
        // Register styles
        wp_register_style(
            'truck-360-style', 
            plugin_dir_url(__FILE__) . 'assets/css/truck-360.css',
            array(),
            '1.0'
        );
        
        // Register scripts
        wp_register_script(
            'truck-360-js',
            plugin_dir_url(__FILE__) . 'assets/js/truck-360.js',
            array('jquery'),
            '1.0',
            true
        );
        
        // Pass Ajax URL to script
        wp_localize_script(
            'truck-360-js',
            'truck360_ajax',
            array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('truck_360_nonce')
            )
        );
    }
    
    public function truck_360_shortcode($atts) {
        // Extract attributes
        $atts = shortcode_atts(
            array(
                'title' => 'Preview your campaign in 360',
                'description' => 'Our new widget allows you to preview your campaign on our trucks. Upload your images below and rotate the truck for a 360 view.'
            ),
            $atts,
            'truck_360_preview'
        );
        
        // Enqueue required scripts and styles
        wp_enqueue_style('truck-360-style');
        wp_enqueue_script('truck-360-js');
        
        // Start output buffering
        ob_start();
        
        // Include template
        include plugin_dir_path(__FILE__) . 'templates/preview-template.php';
        
        // Return the buffered content
        return ob_get_clean();
    }
    
    public function handle_upload() {
        // Verify nonce
        check_ajax_referer('truck_360_nonce', 'nonce');
        
        // Check file size
        if ($_FILES['file']['size'] > 5 * 1024 * 1024) {
            wp_send_json_error(array('message' => 'File size must be less than 5MB'));
            return;
        }
        
        // Get upload directory
        $upload_dir = wp_upload_dir();
        $upload_path = $upload_dir['path'] . '/';
        $upload_url = $upload_dir['url'] . '/';
        
        // Generate unique filename
        $filename = wp_unique_filename($upload_path, $_FILES['file']['name']);
        
        // Move uploaded file
        $upload_file = $upload_path . $filename;
        
        if (move_uploaded_file($_FILES['file']['tmp_name'], $upload_file)) {
            // Success
            wp_send_json_success(array(
                'url' => $upload_url . $filename,
                'side' => $_POST['side']
            ));
        } else {
            // Error
            wp_send_json_error(array('message' => 'Failed to upload file'));
        }
        
        wp_die();
    }
}

// Initialize the plugin
$truck_360_preview = new Truck360Preview();

// Add activation hook to create necessary directories
register_activation_hook(__FILE__, 'truck_360_activate');

function truck_360_activate() {
    // Create assets directory if it doesn't exist
    if (!file_exists(plugin_dir_path(__FILE__) . 'assets')) {
        mkdir(plugin_dir_path(__FILE__) . 'assets');
        mkdir(plugin_dir_path(__FILE__) . 'assets/css');
        mkdir(plugin_dir_path(__FILE__) . 'assets/js');
        mkdir(plugin_dir_path(__FILE__) . 'assets/images');
        
        // Copy default truck images to images directory
        // (You'll need to add these images to your plugin)
        $default_images_path = plugin_dir_path(__FILE__) . 'assets/images/360/';
        if (!file_exists($default_images_path)) {
            mkdir($default_images_path);
        }
    }
    
    // Create templates directory if it doesn't exist
    if (!file_exists(plugin_dir_path(__FILE__) . 'templates')) {
        mkdir(plugin_dir_path(__FILE__) . 'templates');
    }
}