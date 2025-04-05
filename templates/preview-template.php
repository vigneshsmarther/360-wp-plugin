<?php
// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="truck-360-preview">
    <div class="preview-container">
        <div class="preview-row">
            <div class="preview-info-column">
                <h3 class="preview-title"><?php echo esc_html($atts['title']); ?><span class="red-dot"></span></h3>
                <p class="preview-description"><?php echo esc_html($atts['description']); ?></p>
                <div class="preview-alert">
                    <span>Maximum upload size 5MB. Only JPG, PNG, GIF and WEBP files are supported.</span>
                </div>
                <div class="preview-buttons">
                    <a id="btn-preview-sides" class="preview-button" href="#">UPLOAD SIDES</a>
                    <input type="file" id="preview_file_sides" class="hidden-file-input" accept="image/jpeg,image/png,image/gif,image/webp">

                    <a id="btn-preview-back" class="preview-button" href="#">UPLOAD BACK</a>
                    <input type="file" id="preview_file_back" class="hidden-file-input" accept="image/jpeg,image/png,image/gif,image/webp">
                </div>
                <div>
                    <p class="preview-description">Click and drag the truck to rotate it and see it from all angles.</p>
                </div>
            </div>
            <div class="preview-viewer-column">
                <div class="preview-360-holder">
                    <div id="preview-360" class="three-sixty-image-holder"
                         data-url="<?php echo plugin_dir_url(dirname(__FILE__)) . 'assets/images/360/'; ?>"
                         data-imgformat="jpg"
                         data-imgcount="18">
                        <?php for ($i = 1; $i <= 18; $i++) : ?>
                            <img draggable="false" 
                                 src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'assets/images/360/' . $i . '.jpg'; ?>" 
                                 style="width: 100%; height: 100%; object-fit: contain; <?php echo $i > 1 ? 'display: none;' : ''; ?>">
                        <?php endfor; ?>
                    </div>
                    <div class="js-360-loader">
                        <img src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'assets/images/loader.gif'; ?>" alt="Loading...">
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
