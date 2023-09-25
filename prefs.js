'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
//const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
//const {Adw, Gtk, Gio} = imports.gi; // Prepared for next version

const gtkGridOptions = { column_spacing: 10, row_spacing: 5, visible: true };
const gtkGridMargin =  { margin_top: 5, margin_bottom: 5, margin_start: 5, margin_end: 5 };

function init() { }

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
    //settings.bind( 'brightness', brightnessSlider.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT );

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
    //settings.bind( 'saturation', saturationSlider.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT );

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