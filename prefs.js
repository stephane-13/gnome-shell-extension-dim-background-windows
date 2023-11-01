'use strict';

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class DimBackgroundWindowsExtensionPreferences extends ExtensionPreferences {

    // A function used to validate the text entered in the shortcut key editor field
    _validateToggleKey( settings, toggleKeyEntry, toggleKeyStatusLabel ) {
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

    // The main function
    fillPreferencesWindow(window) {

        // Get the extension settings
        const settings = this.getSettings();

        // Create a preferences page
        const page = new Adw.PreferencesPage({
            title: _( 'General' ),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        // Create a preferences group
        const group = new Adw.PreferencesGroup({
            title: _( 'Appearance' ),
            description: _( 'Configure the appearance of the extension' ),
        });
        page.add(group);

        // Create a brightness slider
        let brightnessSlider = Gtk.Scale.new_with_range( Gtk.GTK_ORIENTATION_HORIZONTAL, 0.1, 1.0, 0.01 );
        // Draw the numerical value while the slider is moved
        brightnessSlider.set_draw_value( true );
        // Make the slider use the window width
        brightnessSlider.set_hexpand( true );
        // Set the slider value to the current value
        brightnessSlider.set_value( settings.get_double( 'brightness' ) );
        // Make the slider act on the actual value
        brightnessSlider.connect( 'value-changed', ( ( widget ) => {
            settings.set_double( 'brightness', widget.get_value() );
        }));
        // Add the slider to a new row
        const brightnessRow = new Adw.ActionRow({
            title: _( 'Brightness:' ),
            subtitle: _( 'Set the brightness factor for background windows' )
        });
        brightnessRow.add_suffix( brightnessSlider );
        // Add the row to the group
        group.add( brightnessRow );

        // Create a saturation label and slider
        let saturationSlider = Gtk.Scale.new_with_range( Gtk.GTK_ORIENTATION_HORIZONTAL, 0.0, 1.0, 0.01 );
        // Draw the numerical value while the slider is moved
        saturationSlider.set_draw_value( true );
        // Make the slider use the window width
        saturationSlider.set_hexpand( true );
        // Set the slider value to the current value
        saturationSlider.set_value( settings.get_double( 'saturation' ) );
        // Make the slider act on the actual value
        saturationSlider.connect( 'value-changed', ( ( widget ) => {
            settings.set_double( 'saturation', widget.get_value() );
        }));
        // Add the slider to a new row
        const saturationRow = new Adw.ActionRow({
            title: _( 'Saturation:' ),
            subtitle: _( 'Set the saturation factor for background windows' )
        });
        saturationRow.add_suffix( saturationSlider );
        // Add the row to the group
        group.add( saturationRow );

        // Create a toggle shortcut editor control
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

        // Make the entry act on the actual value
        toggleKeyEntry.connect( 'changed', ( ( _widget ) => { this._validateToggleKey( settings, toggleKeyEntry, toggleKeyStatusLabel ); } ) );

        // Validate the shortcut key editor field
        this._validateToggleKey( settings, toggleKeyEntry, toggleKeyStatusLabel );

        // Add the shortcut key editor field to a new row
        const toggleKeyRow = new Adw.ActionRow({
            title: _( 'Toggle key:' ),
            subtitle: _( 'Set the key to toggle the dimming effect for background windows' )
        });
        toggleKeyRow.add_suffix( toggleKeyEntry );
        // Add the row to the group
        group.add( toggleKeyRow );

        // Add the shortcut key status label to a new row
        const toggleKeyStatusRow = new Adw.ActionRow({
            title: _(''),
            subtitle: _('<i><small>Examples: "&lt;Super&gt;g", "&lt;Ctrl&gt;&lt;Super&gt;g" (without quotes)</small></i>')
        });
        toggleKeyStatusRow.add_suffix( toggleKeyStatusLabel );
        // Add the row to the group
        group.add( toggleKeyStatusRow );

        // Create a dropdown that lets the user choose whether to apply the dimming effect on all monitors, only the primary monitor, or only the focused monitor
        let monitorComboBox = new Gtk.ComboBoxText( { visible: true } );
        monitorComboBox.append( 'all', 'All monitors' );
        monitorComboBox.append( 'primary', 'The primary monitor only' );
        monitorComboBox.append( 'secondary', 'The secondary monitor(s) only' );
        // Set the current value
        monitorComboBox.set_active_id( settings.get_string( 'target-monitor' ) );
        // Make the dropdown use the window width
        monitorComboBox.set_hexpand( true );
        // Make the dropdown act on the actual value
        monitorComboBox.connect( 'changed', ( ( widget ) => {
            settings.set_string( 'target-monitor', widget.get_active_id() );
        }));
        // Add the dropdown to a new row
        const monitorRow = new Adw.ActionRow({
            title: _( 'Apply the dimming effect to:' ),
            subtitle: _( 'Set the display(s) affected by the dimming effect' )
        });
        monitorRow.add_suffix( monitorComboBox );
        // Add the row to the group
        group.add( monitorRow );

        // Create a toggle switch to enable or disable the dimming effect for windows marked as "always on top"
        let alwaysOnTopSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
        // Set the switch value to the current value
        alwaysOnTopSwitch.set_active( settings.get_boolean( 'dim-always-on-top' ) );
        // Make the switch act on the actual value
        alwaysOnTopSwitch.connect( 'notify::active', ( ( widget ) => {
            settings.set_boolean( 'dim-always-on-top', widget.active );
        }));
        const alwaysOnTopRow = new Adw.ActionRow({
            title: _( 'Apply the dimming effect to windows marked as "always on top":' )
            //subtitle: _( '' )
        });
        alwaysOnTopRow.add_suffix( alwaysOnTopSwitch );
        group.add( alwaysOnTopRow );

        // Create a toggle switch to enable or disable the dimming effect for maximized windows
        let maximizedSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
        // Set the switch value to the current value
        maximizedSwitch.set_active( settings.get_boolean( 'dim-maximized' ) );
        // Make the switch act on the actual value
        maximizedSwitch.connect( 'notify::active', ( ( widget ) => {
            settings.set_boolean( 'dim-maximized', widget.active );
        }));
        const maximizedRow = new Adw.ActionRow({
            title: _( 'Apply the dimming effect to maximized windows:' ),
            subtitle: _( 'This applies to fully maximized - horizontally and vertically - windows' )
        });
        maximizedRow.add_suffix( maximizedSwitch );
        group.add( maximizedRow );

        // Create a toggle switch to enable or disable the dimming effect for tiled windows
        let tiledSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
        // Set the switch value to the current value
        tiledSwitch.set_active( settings.get_boolean( 'dim-tiled' ) );
        // Make the switch act on the actual value
        tiledSwitch.connect( 'notify::active', ( ( widget ) => {
            settings.set_boolean( 'dim-tiled', widget.active );
        }));
        const tiledRow = new Adw.ActionRow({
            title: _( 'Apply the dimming effect to tiled windows:' ),
            subtitle: _( 'This applies to tiled - left, right, top or bottom - windows' )
        });
        tiledRow.add_suffix( tiledSwitch );
        group.add( tiledRow );
    }

}
