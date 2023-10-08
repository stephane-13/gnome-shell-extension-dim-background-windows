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

    // Create a brightness label and slider
    let brightnessLabel = new Gtk.Label( { label: 'Brightness:', halign: Gtk.Align.START, visible: true } );
    prefsWidget.attach( brightnessLabel, 0, 0, 1, 1 );
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
    prefsWidget.attach( brightnessSlider, 1, 0, 1, 1 );

    // Create a saturation label and slider
    let saturationLabel = new Gtk.Label( { label: 'Saturation:', halign: Gtk.Align.START, visible: true } );
    prefsWidget.attach( saturationLabel, 0, 1, 1, 1 );
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
    prefsWidget.attach( saturationSlider, 1, 1, 1, 1 );

    // Create a toggle shortcut editor control
    let toggleKeyLabel = new Gtk.Label( { label: 'Dimming effect toggle shortcut:', halign: Gtk.Align.START, visible: true } );
    prefsWidget.attach( toggleKeyLabel, 0, 2, 1, 1 );
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

    prefsWidget.attach( toggleKeyEntry, 1, 2, 1, 1 );
    prefsWidget.attach( toggleKeyStatusLabel, 1, 3, 1, 1 );
    prefsWidget.attach( toggleKeyHelpLabel, 1, 4, 1, 1 );

    // Create a dropdown that lets the user choose whether to apply the dimming effect on all monitors, only the primary monitor, or only the focused monitor
    let monitorLabel = new Gtk.Label( { label: 'Apply the dimming effect to:', halign: Gtk.Align.START, visible: true } );
    prefsWidget.attach( monitorLabel, 0, 5, 1, 1 );
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
    prefsWidget.attach( monitorComboBox, 1, 5, 1, 1 );

    // Create a toggle switch to enable or disable the dimming effect for windows marked as "always on top"
    let alwaysOnTopLabel = new Gtk.Label( { label: "Apply the dimming effect to\nwindows marked as \"always on top\":", halign: Gtk.Align.START, visible: true } );
    prefsWidget.attach( alwaysOnTopLabel, 0, 6, 1, 1 );
    let alwaysOnTopSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
    // Set the switch value to the current value
    alwaysOnTopSwitch.set_active( settings.get_boolean( 'dim-always-on-top' ) );
    // Make the switch act on the actual value
    alwaysOnTopSwitch.connect( 'notify::active', function ( widget ) {
        settings.set_boolean( 'dim-always-on-top', widget.active );
    });
    prefsWidget.attach( alwaysOnTopSwitch, 1, 6, 1, 1 );

    // Return the built preferences widget
    return prefsWidget;
}

/* Prepared for next version
function fillPreferencesWindow(window) {
    // Get the extension settings
    const settings = ExtensionUtils.getSettings();

    window.search_enabled = true;
    // Create a preferences page, with a single group
    const page = new Adw.PreferencesPage({
        title: 'General',
        icon_name: 'dialog-information-symbolic',
    });
    window.add(page);
    window._settings = this.getSettings();

    const group = new Adw.PreferencesGroup({
        title: 'Appearance',
        description: 'Configure the appearance of the background windows',
    });
    page.add(group);

    // Create a new row to control brightness
    let row = new Adw.SpinRow({
        title: 'Brightness',
        subtitle: 'Sets the brightness of the background windows, from 0.1 (very dark) to 1.0 (normal)',
        adjustment: new Gtk.Adjustment({
            lower: 0.1,
            upper: 1.0,
            step_increment: 0.01,
            page_increment: 0.1,
            value: settings.get_double('brightness')
        }),
    });
    group.add(row);

    // Create a new row to control saturation
    row = new Adw.SpinRow({
        title: 'Saturation',
        subtitle: 'Sets the saturation of the background windows, from 0.0 (grayscale) to 1.0 (normal)',
        adjustment: new Gtk.Adjustment({
            lower: 0.0,
            upper: 1.0,
            step_increment: 0.01,
            page_increment: 0.1,
            value: settings.get_double('saturation')
        }),
    });
    group.add(row);

    window._settings.bind( 'show-indicator', row, 'active', Gio.SettingsBindFlags.DEFAULT );
}
*/