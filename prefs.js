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

        // Create a preferences group for the brightness settings
        const groupBrightness = new Adw.PreferencesGroup({
            title: _( 'Brightness' ),
            description: _( 'Set the brightness factor for background windows' ),
        });
        page.add( groupBrightness );

        // Create a preferences group for the saturation settings
        const groupSaturation = new Adw.PreferencesGroup({
            title: _( 'Saturation' ),
            description: _( 'Set the saturation factor for background windows' ),
        });
        page.add( groupSaturation );

        // Create a preferences group for the other settings
        const groupOther = new Adw.PreferencesGroup({
            title: _( 'Other Settings' ),
            description: _( 'Configure the shortcut, displays and windows settings' ),
        });
        page.add( groupOther );



        // ========== BASE BRIGHTNESS CONTROL ==========

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
            title: _( 'Base brightness factor' ),
            subtitle: _( 'Applies globally unless the night light mode or dark style appearance overrides are enabled' )
        });
        brightnessRow.add_suffix( brightnessSlider );
        // Add the row to the group
        groupBrightness.add( brightnessRow );



        // ========== NIGHT LIGHT BRIGHTNESS CONTROL ==========

        // Create a brightness factor slider for night light mode
        let nightLightBrightnessSlider = Gtk.Scale.new_with_range( Gtk.GTK_ORIENTATION_HORIZONTAL, 0.1, 1.0, 0.01 );
        // Draw the numerical value while the slider is moved
        nightLightBrightnessSlider.set_draw_value( true );
        // Make the slider use the window width
        nightLightBrightnessSlider.set_hexpand( true );
        // Set the slider value to the current value
        nightLightBrightnessSlider.set_value( settings.get_double( 'brightness-night-light' ) );
        // Make the slider act on the actual value
        nightLightBrightnessSlider.connect( 'value-changed', ( ( widget ) => {
            settings.set_double( 'brightness-night-light', widget.get_value() );
        }));
        // Enable or disable the slider depending on the current override toggle switch value
        nightLightBrightnessSlider.set_sensitive( settings.get_boolean( 'brightness-night-light-override' ) );

        // Create a toggle switch to enable or disable the night light mode brightness factor
        let nightLightBrightnessSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
        // Set the switch value to the current value
        nightLightBrightnessSwitch.set_active( settings.get_boolean( 'brightness-night-light-override' ) );
        // Make the switch act on the actual value
        nightLightBrightnessSwitch.connect( 'notify::active', ( ( widget ) => {
            settings.set_boolean( 'brightness-night-light-override', widget.active );
            nightLightBrightnessSlider.set_sensitive( widget.active );
        }));

        // Add the slider to a new row
        const nightLightBrightnessRow = new Adw.ActionRow({
            title: _( 'Night Light brightness override' ),
            subtitle: _( 'Applies if night light mode is enabled' )
        });
        nightLightBrightnessRow.add_prefix( nightLightBrightnessSwitch );
        nightLightBrightnessRow.add_suffix( nightLightBrightnessSlider );
        // Add the row to the group
        groupBrightness.add( nightLightBrightnessRow );



        // ========== DARK STYLE APPEARANCE BRIGHTNESS CONTROL ==========

        // Create a brightness factor slider for dark style appearance
        let darkStyleBrightnessSlider = Gtk.Scale.new_with_range( Gtk.GTK_ORIENTATION_HORIZONTAL, 0.1, 1.0, 0.01 );
        // Draw the numerical value while the slider is moved
        darkStyleBrightnessSlider.set_draw_value( true );
        // Make the slider use the window width
        darkStyleBrightnessSlider.set_hexpand( true );
        // Set the slider value to the current value
        darkStyleBrightnessSlider.set_value( settings.get_double( 'brightness-dark-style' ) );
        // Make the slider act on the actual value
        darkStyleBrightnessSlider.connect( 'value-changed', ( ( widget ) => {
            settings.set_double( 'brightness-dark-style', widget.get_value() );
        }));
        // Enable or disable the slider depending on the current override toggle switch value
        darkStyleBrightnessSlider.set_sensitive( settings.get_boolean( 'brightness-dark-style-override' ) );

        // Create a toggle switch to enable or disable the dark style appearance brightness factor
        let darkStyleBrightnessSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
        // Set the switch value to the current value
        darkStyleBrightnessSwitch.set_active( settings.get_boolean( 'brightness-dark-style-override' ) );
        // Make the switch act on the actual value
        darkStyleBrightnessSwitch.connect( 'notify::active', ( ( widget ) => {
            settings.set_boolean( 'brightness-dark-style-override', widget.active );
            darkStyleBrightnessSlider.set_sensitive( widget.active );
        }));

        // Add the slider to a new row
        const darkStyleBrightnessRow = new Adw.ActionRow({
            title: _( 'Dark Style brightness override' ),
            subtitle: _( 'Applies if dark style appearance is enabled' )
        });
        darkStyleBrightnessRow.add_prefix( darkStyleBrightnessSwitch );
        darkStyleBrightnessRow.add_suffix( darkStyleBrightnessSlider );
        // Add the row to the group
        groupBrightness.add( darkStyleBrightnessRow );



        // ========== BRIGHTNESS NOTE ==========

        // Add a note
        const brightnessCommentRow = new Adw.ActionRow({
            title: _(''),
            subtitle: _('<small>The night light override has priority over the dark style override if both are enabled above and if both modes are enabled in the Gnome settings</small>')
        });
        groupBrightness.add( brightnessCommentRow );



        // ========== BASE SATURATION CONTROLS ==========

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
            title: _( 'Base saturation factor' ),
            subtitle: _( 'Applies globally unless the night light mode or dark style appearance overrides are enabled' )
        });
        saturationRow.add_suffix( saturationSlider );
        // Add the row to the group
        groupSaturation.add( saturationRow );



        // ========== NIGHT LIGHT SATURATION CONTROL ==========

        // Create a saturation correction factor slider for night light mode
        let nightLightSaturationSlider = Gtk.Scale.new_with_range( Gtk.GTK_ORIENTATION_HORIZONTAL, 0.0, 1.0, 0.01 );
        // Draw the numerical value while the slider is moved
        nightLightSaturationSlider.set_draw_value( true );
        // Make the slider use the window width
        nightLightSaturationSlider.set_hexpand( true );
        // Set the slider value to the current value
        nightLightSaturationSlider.set_value( settings.get_double( 'saturation-night-light' ) );
        // Make the slider act on the actual value
        nightLightSaturationSlider.connect( 'value-changed', ( ( widget ) => {
            settings.set_double( 'saturation-night-light', widget.get_value() );
        }));
        // Enable or disable the slider depending on the current override toggle switch value
        nightLightSaturationSlider.set_sensitive( settings.get_boolean( 'saturation-night-light-override' ) );

        // Create a toggle switch to enable or disable the night light mode saturation factor
        let nightLightSaturationSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
        // Set the switch value to the current value
        nightLightSaturationSwitch.set_active( settings.get_boolean( 'saturation-night-light-override' ) );
        // Make the switch act on the actual value
        nightLightSaturationSwitch.connect( 'notify::active', ( ( widget ) => {
            settings.set_boolean( 'saturation-night-light-override', widget.active );
            nightLightSaturationSlider.set_sensitive( widget.active );
        }));

        // Add the slider to a new row
        const nightLightSaturationRow = new Adw.ActionRow({
            title: _( 'Night Light saturation override' ),
            subtitle: _( 'Applies if night light mode is enabled' )
        });
        nightLightSaturationRow.add_prefix( nightLightSaturationSwitch );
        nightLightSaturationRow.add_suffix( nightLightSaturationSlider );
        // Add the row to the group
        groupSaturation.add( nightLightSaturationRow );



        // ========== DARK STYLE APPEARANCE SATURATION CONTROL ==========

        // Create a saturation correction factor slider for dark style appearance
        let darkStyleSaturationSlider = Gtk.Scale.new_with_range( Gtk.GTK_ORIENTATION_HORIZONTAL, 0.0, 1.0, 0.01 );
        // Draw the numerical value while the slider is moved
        darkStyleSaturationSlider.set_draw_value( true );
        // Make the slider use the window width
        darkStyleSaturationSlider.set_hexpand( true );
        // Set the slider value to the current value
        darkStyleSaturationSlider.set_value( settings.get_double( 'saturation-dark-style' ) );
        // Make the slider act on the actual value
        darkStyleSaturationSlider.connect( 'value-changed', ( ( widget ) => {
            settings.set_double( 'saturation-dark-style', widget.get_value() );
        }));
        // Enable or disable the slider depending on the current override toggle switch value
        darkStyleSaturationSlider.set_sensitive( settings.get_boolean( 'saturation-dark-style-override' ) );

        // Create a toggle switch to enable or disable the dark style appearance saturation factor
        let darkStyleSaturationSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
        // Set the switch value to the current value
        darkStyleSaturationSwitch.set_active( settings.get_boolean( 'saturation-dark-style-override' ) );
        // Make the switch act on the actual value
        darkStyleSaturationSwitch.connect( 'notify::active', ( ( widget ) => {
            settings.set_boolean( 'saturation-dark-style-override', widget.active );
            darkStyleSaturationSlider.set_sensitive( widget.active );
        }));

        // Add the slider to a new row
        const darkStyleSaturationRow = new Adw.ActionRow({
            title: _( 'Dark style saturation override' ),
            subtitle: _( 'Applies if dark style appearance is enabled' )
        });
        darkStyleSaturationRow.add_prefix( darkStyleSaturationSwitch );
        darkStyleSaturationRow.add_suffix( darkStyleSaturationSlider );
        // Add the row to the group
        groupSaturation.add( darkStyleSaturationRow );



        // ========== SATURATION NOTE ==========

        // Add a note
        const saturationCommentRow = new Adw.ActionRow({
            title: _(''),
            subtitle: _('<small>The night light override has priority over the dark style override if both are enabled above and if both modes are enabled in the Gnome settings</small>')
        });
        groupSaturation.add( saturationCommentRow );


        // ========== OTHER CONTROLS ==========

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
        groupOther.add( toggleKeyRow );

        // Add the shortcut key status label to a new row
        const toggleKeyStatusRow = new Adw.ActionRow({
            title: _(''),
            subtitle: _('<i><small>Examples: "&lt;Super&gt;g", "&lt;Ctrl&gt;&lt;Super&gt;g" (without quotes)</small></i>')
        });
        toggleKeyStatusRow.add_suffix( toggleKeyStatusLabel );
        // Add the row to the group
        groupOther.add( toggleKeyStatusRow );

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
        groupOther.add( monitorRow );

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
        groupOther.add( alwaysOnTopRow );

        // Create a toggle switch to enable or disable the dimming effect for maximized windows
        let maximizedSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
        // Set the switch value to the current value
        maximizedSwitch.set_active( settings.get_boolean( 'dim-maximized' ) );
        // Make the switch act on the actual value
        maximizedSwitch.connect( 'notify::active', ( ( widget ) => {
            settings.set_boolean( 'dim-maximized', widget.active );
        }));
        const maximizedRow = new Adw.ActionRow({
            title: _( 'Apply the dimming effect to fully maximized windows:' ),
            subtitle: _( 'This applies to fully maximized - horizontally AND vertically - windows' )
        });
        maximizedRow.add_suffix( maximizedSwitch );
        groupOther.add( maximizedRow );

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
            subtitle: _( 'This applies to tiled - left, right, top or bottom - windows and horizontally OR vertically - not both - maximized windows' )
        });
        tiledRow.add_suffix( tiledSwitch );
        groupOther.add( tiledRow );

        // Create a toggle switch to enable or disable the dimming effect for the background
        let backgroundSwitch = new Gtk.Switch( { halign: Gtk.Align.START, valign: Gtk.Align.CENTER, visible: true } );
        // Set the switch value to the current value
        backgroundSwitch.set_active( settings.get_boolean( 'dim-background' ) );
        // Make the switch act on the actual value
        backgroundSwitch.connect( 'notify::active', ( ( widget ) => {
            settings.set_boolean( 'dim-background', widget.active );
        }));
        const backgroundRow = new Adw.ActionRow({
            title: _( 'Apply the dimming effect to the background:' ),
            subtitle: _( 'This applies to the desktop background if at least one window is visible' )
        });
        backgroundRow.add_suffix( backgroundSwitch );
        groupOther.add( backgroundRow );
    }

}
