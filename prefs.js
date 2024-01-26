'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Gtk = imports.gi.Gtk;
//const {Adw, Gtk, Gio} = imports.gi; // Prepared for next version

const gtkGridOptions = { column_spacing: 10, row_spacing: 5, visible: true };
const gtkGridMargin =  { margin_top: 5, margin_bottom: 5, margin_start: 5, margin_end: 5 };

function init() { }

// A function used to validate the text entered in the shortcut key editor field
function validateToggleKey( settings, toggleKeyEntry, toggleKeyStatusLabel ) {
    // Get the shortcut key entered in the editor field
    let shortcutText = toggleKeyEntry.get_text();
    // If the shortcut text is empty, consider that we want no shortcut
    if( shortcutText === '' ) {
        settings.set_strv( 'toggle-shortcut', [] );
        toggleKeyStatusLabel.set_markup( '<i><small>No shortcut defined.</small></i>' );
    // If the shortcut text is not empty, try to parse it
    } else {
        const [success, key, mods] = Gtk.accelerator_parse( shortcutText );
        if( success && Gtk.accelerator_valid( key, mods ) ) {
            const shortcut = Gtk.accelerator_name( key, mods );
            settings.set_strv( 'toggle-shortcut', [shortcut] );
            toggleKeyStatusLabel.set_markup( '<i><small>The shortcut above is <b>valid</b>.</small></i>' );
        } else {
            settings.set_strv( 'toggle-shortcut', [] );
            toggleKeyStatusLabel.set_markup( '<i><small>The shortcut above is <b>invalid</b>.</small></i>' );
        }
    }
}

function buildPrefsWidget() {
    // Get the extension settings
    const settings = ExtensionUtils.getSettings();
    // Create the preferences widget
    let prefsWidget = new Gtk.Grid({ ...gtkGridMargin, ...gtkGridOptions });
    let iRow = 0;

    // ========== BASE BRIGHTNESS CONTROL ==========

    // Create a brightness label and slider
    let brightnessLabel = new Gtk.Label( { label: 'Base brightness factor\n<small>Applies globally unless the night light mode or dark style appearance overrides are enabled</small>', halign: Gtk.Align.START, visible: true, use_markup: true } );
    prefsWidget.attach( brightnessLabel, 0, iRow, 2, 1 );
    let brightnessSlider = Gtk.Scale.new_with_range( Gtk.GTK_ORIENTATION_HORIZONTAL, 0.1, 1.0, 0.01 );
    // Draw the numerical value while the slider is moved
    brightnessSlider.set_draw_value( true );
    // Make the slider use the window width
    brightnessSlider.set_hexpand( true );
    // Set the slider value to the current value
    brightnessSlider.set_value( settings.get_double( 'brightness' ) );
    // Make the slider act on the actual value
    brightnessSlider.connect( 'value-changed', function ( widget ) {
        settings.set_double( 'brightness', widget.get_value() );
    });
    prefsWidget.attach( brightnessSlider, 2, iRow, 1, 1 );
    iRow += 1;

    // ========== NIGHT LIGHT BRIGHTNESS CONTROL ==========

    // Create a brightness factor slider for night light mode
    let nightLightBrightnessLabel = new Gtk.Label( { label: 'Night light brightness override\n<small>Applies if night light mode is enabled</small>', halign: Gtk.Align.START, visible: true, use_markup: true } );
    nightLightBrightnessLabel.set_hexpand( true );
    prefsWidget.attach( nightLightBrightnessLabel, 1, iRow, 1, 1 );
    let nightLightBrightnessSlider = Gtk.Scale.new_with_range( Gtk.GTK_ORIENTATION_HORIZONTAL, 0.1, 1.0, 0.01 );
    // Draw the numerical value while the slider is moved
    nightLightBrightnessSlider.set_draw_value( true );
    // Make the slider use the window width
    nightLightBrightnessSlider.set_hexpand( true );
    // Set the slider value to the current value
    nightLightBrightnessSlider.set_value( settings.get_double( 'brightness-night-light' ) );
    // Make the slider act on the actual value
    nightLightBrightnessSlider.connect( 'value-changed', function ( widget ) {
        settings.set_double( 'brightness-night-light', widget.get_value() );
    });
    // Enable or disable the slider depending on the current override toggle switch value
    nightLightBrightnessSlider.set_sensitive( settings.get_boolean( 'brightness-night-light-override' ) );
    prefsWidget.attach( nightLightBrightnessSlider, 2, iRow, 1, 1 );

    // Add a on/off toggle switch for night light mode
    let nightLightSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
    // Set the switch value to the current value
    nightLightSwitch.set_active( settings.get_boolean( 'brightness-night-light-override' ) );
    // Make the switch act on the actual value
    nightLightSwitch.connect( 'notify::active', function ( widget ) {
        settings.set_boolean( 'brightness-night-light-override', widget.active );
    });
    // Make the on/off switch enable/disable the brightness factor slider for night light mode
    nightLightSwitch.connect( 'notify::active', function ( widget ) {
        nightLightBrightnessSlider.set_sensitive( widget.active );
    });
    prefsWidget.attach( nightLightSwitch, 0, iRow, 1, 1 );
    iRow += 1;

    // ========== DARK STYLE APPEARANCE BRIGHTNESS CONTROL ==========

    // Create a brightness factor slider for dark style appearance mode
    let darkStyleBrightnessLabel = new Gtk.Label( { label: 'Dark style brightness override\n<small>Applies if dark style appearance is enabled</small>', halign: Gtk.Align.START, visible: true, use_markup: true } );
    darkStyleBrightnessLabel.set_hexpand( true );
    prefsWidget.attach( darkStyleBrightnessLabel, 1, iRow, 1, 1 );
    let darkStyleBrightnessSlider = Gtk.Scale.new_with_range( Gtk.GTK_ORIENTATION_HORIZONTAL, 0.1, 1.0, 0.01 );
    // Draw the numerical value while the slider is moved
    darkStyleBrightnessSlider.set_draw_value( true );
    // Make the slider use the window width
    darkStyleBrightnessSlider.set_hexpand( true );
    // Set the slider value to the current value
    darkStyleBrightnessSlider.set_value( settings.get_double( 'brightness-dark-style' ) );
    // Make the slider act on the actual value
    darkStyleBrightnessSlider.connect( 'value-changed', function ( widget ) {
        settings.set_double( 'brightness-dark-style', widget.get_value() );
    });
    // Enable or disable the slider depending on the current override toggle switch value
    darkStyleBrightnessSlider.set_sensitive( settings.get_boolean( 'brightness-dark-style-override' ) );
    prefsWidget.attach( darkStyleBrightnessSlider, 2, iRow, 1, 1 );

    // Add a on/off toggle switch for dark style appearance mode
    let darkStyleSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
    // Set the switch value to the current value
    darkStyleSwitch.set_active( settings.get_boolean( 'brightness-dark-style-override' ) );
    // Make the switch act on the actual value
    darkStyleSwitch.connect( 'notify::active', function ( widget ) {
        settings.set_boolean( 'brightness-dark-style-override', widget.active );
    });
    // Make the on/off switch enable/disable the brightness factor slider for dark style appearance mode
    darkStyleSwitch.connect( 'notify::active', function ( widget ) {
        darkStyleBrightnessSlider.set_sensitive( widget.active );
    });
    prefsWidget.attach( darkStyleSwitch, 0, iRow, 1, 1 );
    iRow += 1;

    // ========== BRIGHTNESS NOTE ==========

    // Add a note
    let brightnessCommentLabel = new Gtk.Label( { label: '<i><small>The night light override has priority over the dark style override if both are enabled above and if both modes are enabled in the Gnome settings</small></i>', halign: Gtk.Align.START, visible: true, use_markup: true } );
    prefsWidget.attach( brightnessCommentLabel, 0, iRow, 3, 1 );
    iRow += 1;

    // Add an horizontal separator
    let separatorBrightness = new Gtk.Separator( { orientation: Gtk.Orientation.HORIZONTAL, visible: true } );
    prefsWidget.attach( separatorBrightness, 0, iRow, 3, 1 );
    iRow += 1;

    // ========== BASE SATURATION CONTROL ==========    

    // Create a saturation label and slider
    let saturationLabel = new Gtk.Label( { label: 'Base saturation factor\n<small>Applies globally unless the night light mode or dark style appearance overrides are enabled</small>', halign: Gtk.Align.START, visible: true, use_markup: true } );
    prefsWidget.attach( saturationLabel, 0, iRow, 2, 1 );
    let saturationSlider = Gtk.Scale.new_with_range( Gtk.GTK_ORIENTATION_HORIZONTAL, 0.0, 1.0, 0.01 );
    // Draw the numerical value while the slider is moved
    saturationSlider.set_draw_value( true );
    // Make the slider use the window width
    saturationSlider.set_hexpand( true );
    // Set the slider value to the current value
    saturationSlider.set_value( settings.get_double( 'saturation' ) );
    // Make the slider act on the actual value
    saturationSlider.connect( 'value-changed', function ( widget ) {
        settings.set_double( 'saturation', widget.get_value() );
    });
    prefsWidget.attach( saturationSlider, 2, iRow, 1, 1 );
    iRow += 1;

    // ========== NIGHT LIGHT SATURATION CONTROL ==========

    // Create a saturation factor slider for night light mode
    let nightLightSaturationLabel = new Gtk.Label( { label: 'Night light saturation override\n<small>Applies if night light mode is enabled</small>', halign: Gtk.Align.START, visible: true, use_markup: true } );
    nightLightSaturationLabel.set_hexpand( true );
    prefsWidget.attach( nightLightSaturationLabel, 1, iRow, 1, 1 );
    let nightLightSaturationSlider = Gtk.Scale.new_with_range( Gtk.GTK_ORIENTATION_HORIZONTAL, 0.0, 1.0, 0.01 );
    // Draw the numerical value while the slider is moved
    nightLightSaturationSlider.set_draw_value( true );
    // Make the slider use the window width
    nightLightSaturationSlider.set_hexpand( true );
    // Set the slider value to the current value
    nightLightSaturationSlider.set_value( settings.get_double( 'saturation-night-light' ) );
    // Make the slider act on the actual value
    nightLightSaturationSlider.connect( 'value-changed', function ( widget ) {
        settings.set_double( 'saturation-night-light', widget.get_value() );
    });
    // Enable or disable the slider depending on the current override toggle switch value
    nightLightSaturationSlider.set_sensitive( settings.get_boolean( 'saturation-night-light-override' ) );
    prefsWidget.attach( nightLightSaturationSlider, 2, iRow, 1, 1 );

    // Add a on/off toggle switch for night light mode
    let nightLightSaturationSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
    // Set the switch value to the current value
    nightLightSaturationSwitch.set_active( settings.get_boolean( 'saturation-night-light-override' ) );
    // Make the switch act on the actual value
    nightLightSaturationSwitch.connect( 'notify::active', function ( widget ) {
        settings.set_boolean( 'saturation-night-light-override', widget.active );
    });
    // Make the on/off switch enable/disable the saturation factor slider for night light mode
    nightLightSaturationSwitch.connect( 'notify::active', function ( widget ) {
        nightLightSaturationSlider.set_sensitive( widget.active );
    });
    prefsWidget.attach( nightLightSaturationSwitch, 0, iRow, 1, 1 );
    iRow += 1;

    // ========== DARK STYLE APPEARANCE SATURATION CONTROL ==========

    // Create a saturation factor slider for dark style appearance mode
    let darkStyleSaturationLabel = new Gtk.Label( { label: 'Dark style saturation override\n<small>Applies if dark style appearance is enabled</small>', halign: Gtk.Align.START, visible: true, use_markup: true } );
    darkStyleSaturationLabel.set_hexpand( true );
    prefsWidget.attach( darkStyleSaturationLabel, 1, iRow, 1, 1 );
    let darkStyleSaturationSlider = Gtk.Scale.new_with_range( Gtk.GTK_ORIENTATION_HORIZONTAL, 0.0, 1.0, 0.01 );
    // Draw the numerical value while the slider is moved
    darkStyleSaturationSlider.set_draw_value( true );
    // Make the slider use the window width
    darkStyleSaturationSlider.set_hexpand( true );
    // Set the slider value to the current value
    darkStyleSaturationSlider.set_value( settings.get_double( 'saturation-dark-style' ) );
    // Make the slider act on the actual value
    darkStyleSaturationSlider.connect( 'value-changed', function ( widget ) {
        settings.set_double( 'saturation-dark-style', widget.get_value() );
    });
    // Enable or disable the slider depending on the current override toggle switch value
    darkStyleSaturationSlider.set_sensitive( settings.get_boolean( 'saturation-dark-style-override' ) );
    prefsWidget.attach( darkStyleSaturationSlider, 2, iRow, 1, 1 );

    // Add a on/off toggle switch for dark style appearance mode
    let darkStyleSaturationSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
    // Set the switch value to the current value
    darkStyleSaturationSwitch.set_active( settings.get_boolean( 'saturation-dark-style-override' ) );
    // Make the switch act on the actual value
    darkStyleSaturationSwitch.connect( 'notify::active', function ( widget ) {
        settings.set_boolean( 'saturation-dark-style-override', widget.active );
    });
    // Make the on/off switch enable/disable the saturation factor slider for dark style appearance mode
    darkStyleSaturationSwitch.connect( 'notify::active', function ( widget ) {
        darkStyleSaturationSlider.set_sensitive( widget.active );
    });
    prefsWidget.attach( darkStyleSaturationSwitch, 0, iRow, 1, 1 );
    iRow += 1;

    // ========== SATURATION NOTE ==========

    // Add a note
    let saturationCommentLabel = new Gtk.Label( { label: '<i><small>The night light override has priority over the dark style override if both are enabled above and if both modes are enabled in the Gnome settings</small></i>', halign: Gtk.Align.START, visible: true, use_markup: true } );
    prefsWidget.attach( saturationCommentLabel, 0, iRow, 3, 1 );
    iRow += 1;

    // Add an horizontal separator
    let separatorSaturation = new Gtk.Separator( { orientation: Gtk.Orientation.HORIZONTAL, visible: true } );
    prefsWidget.attach( separatorSaturation, 0, iRow, 3, 1 );
    iRow += 1;

    // ========== OTHER ONTROLS ==========
    
    // Create a toggle shortcut editor control
    let toggleKeyLabel = new Gtk.Label( { label: 'Dimming effect toggle shortcut', halign: Gtk.Align.START, visible: true } );
    prefsWidget.attach( toggleKeyLabel, 0, iRow, 2, 1 );
    let toggleKeyEntry = new Gtk.Entry( { visible: true } );
    // Set the entry text to the current value
    let shortcut = settings.get_strv( 'toggle-shortcut' )[0];
    // If the shortcut string is undefined, set it to an empty string
    if( typeof shortcut === 'undefined' ) {
        shortcut = '';
    }
    toggleKeyEntry.set_text( shortcut );
    // Make the entry use the window width
    toggleKeyEntry.set_hexpand( true );

    // Add a shortcut key status label to show if the shortcut is valid or not
    let toggleKeyStatusLabel = new Gtk.Label( { label: '', halign: Gtk.Align.START, visible: true, use_markup: true } );

    // Add a note on how to use the shortcut editor field
    let toggleKeyHelpLabel = new Gtk.Label( { label: '<i><small>Examples: "&lt;Super&gt;g", "&lt;Ctrl&gt;&lt;Super&gt;g" (without quotes)</small></i>', halign: Gtk.Align.START, visible: true, use_markup: true } );

    // Make the entry act on the actual value
    toggleKeyEntry.connect( 'changed', function ( _widget ) { validateToggleKey( settings, toggleKeyEntry, toggleKeyStatusLabel ); } );

    // Validate the shortcut key editor field
    validateToggleKey( settings, toggleKeyEntry, toggleKeyStatusLabel );

    prefsWidget.attach( toggleKeyEntry, 2, iRow, 1, 1 );
    prefsWidget.attach( toggleKeyStatusLabel, 2, iRow + 1, 1, 1 );
    prefsWidget.attach( toggleKeyHelpLabel, 2, iRow+2, 1, 1 );
    iRow += 3;

    // Create a dropdown that lets the user choose whether to apply the dimming effect on all monitors, only the primary monitor, or only the focused monitor
    let monitorLabel = new Gtk.Label( { label: 'Apply the dimming effect to', halign: Gtk.Align.START, visible: true } );
    prefsWidget.attach( monitorLabel, 0, iRow, 2, 1 );
    let monitorComboBox = new Gtk.ComboBoxText( { visible: true } );
    monitorComboBox.append( 'all', 'All monitors' );
    monitorComboBox.append( 'primary', 'The primary monitor only' );
    monitorComboBox.append( 'secondary', 'The secondary monitor(s) only' );
    // Set the current value
    monitorComboBox.set_active_id( settings.get_string( 'target-monitor' ) );
    // Make the dropdown use the window width
    monitorComboBox.set_hexpand( true );
    // Make the dropdown act on the actual value
    monitorComboBox.connect( 'changed', function ( widget ) {
        settings.set_string( 'target-monitor', widget.get_active_id() );
    });
    prefsWidget.attach( monitorComboBox, 2, iRow, 1, 1 );
    iRow += 1;

    // Create a toggle switch to enable or disable the dimming effect for windows marked as "always on top"
    let alwaysOnTopLabel = new Gtk.Label( { label: "Apply the dimming effect to windows marked as \"always on top\":", halign: Gtk.Align.START, visible: true } );
    prefsWidget.attach( alwaysOnTopLabel, 0, iRow, 2, 1 );
    let alwaysOnTopSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
    // Set the switch value to the current value
    alwaysOnTopSwitch.set_active( settings.get_boolean( 'dim-always-on-top' ) );
    // Make the switch act on the actual value
    alwaysOnTopSwitch.connect( 'notify::active', function ( widget ) {
        settings.set_boolean( 'dim-always-on-top', widget.active );
    });
    prefsWidget.attach( alwaysOnTopSwitch, 2, iRow, 1, 1 );
    iRow += 1;

    // Create a toggle switch to enable or disable the dimming effect for maximized windows
    let maximizedLabel = new Gtk.Label( { label: "Apply the dimming effect to maximized windows", halign: Gtk.Align.START, visible: true } );
    prefsWidget.attach( maximizedLabel, 0, iRow, 2, 1 );
    let maximizedSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
    // Set the switch value to the current value
    maximizedSwitch.set_active( settings.get_boolean( 'dim-maximized' ) );
    // Make the switch act on the actual value
    maximizedSwitch.connect( 'notify::active', function ( widget ) {
        settings.set_boolean( 'dim-maximized', widget.active );
    });
    prefsWidget.attach( maximizedSwitch, 2, iRow, 1, 1 );
    iRow += 1;

    // Create a toggle switch to enable or disable the dimming effect for tiled windows
    let tiledLabel = new Gtk.Label( { label: "Apply the dimming effect to tiled windows:", halign: Gtk.Align.START, visible: true } );
    prefsWidget.attach( tiledLabel, 0, iRow, 2, 1 );
    let tiledSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
    // Set the switch value to the current value
    tiledSwitch.set_active( settings.get_boolean( 'dim-tiled' ) );
    // Make the switch act on the actual value
    tiledSwitch.connect( 'notify::active', function ( widget ) {
        settings.set_boolean( 'dim-tiled', widget.active );
    });
    prefsWidget.attach( tiledSwitch, 2, iRow, 1, 1 );

    // Return the built preferences widget
    return prefsWidget;
}
