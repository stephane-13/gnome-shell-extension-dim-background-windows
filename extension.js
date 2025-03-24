import Meta from 'gi://Meta';
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Shell from 'gi://Shell';
import Clutter from 'gi://Clutter';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
// import the Gio library
import Gio from 'gi://Gio';

export default class DimBackgroundWindowsExtension extends Extension {

    // The dim effect object
    _DimWindowEffect = new GObject.registerClass(
        {
            GTypeName: 'DimWindowEffect',
        },
        class DimWindowEffect extends Clutter.ShaderEffect {
            constructor( brightness, saturation ) {
                super();
                // set uniforms
                this.set_uniform_value( 'tex', 0 );
                this.set_uniform_value( 'brightness', parseFloat( brightness - 1e-6 ) );
                this.set_uniform_value( 'saturation', parseFloat( saturation - 1e-6 ) );
            }

            vfunc_get_static_shader_source() {
                return ' \
                    uniform sampler2D tex; \
                    uniform float brightness; \
                    uniform float saturation; \
                    void main() { \
                        vec4 color = texture2D( tex, cogl_tex_coord_in[0].st ); \
                        color.rgb *= brightness; \
                        float colorAvg = ( color.r + color.g + color.b ) / 3.0; \
                        color.r = color.r - ( color.r - colorAvg ) * ( 1.0 - saturation ); \
                        color.g = color.g - ( color.g - colorAvg ) * ( 1.0 - saturation ); \
                        color.b = color.b - ( color.b - colorAvg ) * ( 1.0 - saturation ); \
                        cogl_color_out = color * cogl_color_in; \
                    } \
                ';
            }

            vfunc_paint_target(...params) {
              super.vfunc_paint_target(...params);
            }

            set_brightness( brightness ) {
                this.set_uniform_value( 'brightness', parseFloat( brightness - 1e-6 ) );
            }

            set_saturation( saturation ) {
                this.set_uniform_value( 'saturation', parseFloat( saturation - 1e-6 ) );
            }
        }
    );

    // The function called when the extension is enabled / starts
    enable() {

        // Get the extension settings
        this.settings = this.getSettings();
        // Get the gnome settings
        this.gnomeSettings = new Gio.Settings( { schema_id: 'org.gnome.settings-daemon.plugins.color' } );
        // Get the interface settings
        this.interfaceSettings = new Gio.Settings( { schema_id: 'org.gnome.desktop.interface' } );

        // An object to store the listener for the overview being shown
        this.on_shown_overview = null;
        // An object to store the listener for the overview being hidden
        this.on_hidden_overview = null;
        // An object to store the listener for the toggle shortcut change
        this.on_toggle_key = null;
        // An object to store the listener for the target monitor type change
        this.on_target_monitor_change = null;
        // An object to store the listener for the always-on-top setting change
        this.on_always_on_top_change = null;
        // An object to store the listener for the maximized windows setting change
        this.on_maximized_windows_change = null;
        // An object to store the listener for the tiled windows setting change
        this.on_tiled_windows_change = null;
        // An object to store the listener for the background dimming setting change
        this.on_background_change = null;

        // Enable the dimming effect, which could have been previsouly disabled by the keyboard shortcut
        this.settings.set_boolean( 'dimming-enabled', true );

        // Create a global keybinding to toggle the extension dimming effect
        Main.wm.addKeybinding( 'toggle-shortcut', this.settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.ALL, (() => {
            this.settings.set_boolean( 'dimming-enabled', ! this.settings.get_boolean( 'dimming-enabled' ) );
            this._process_windows();
        }));
        // Need a listener to update the keybinding when it is changed in the preferences window
        this.on_toggle_key = this.settings.connect( 'changed::toggle-shortcut', (() => {
            Main.wm.removeKeybinding( 'toggle-shortcut' );
            Main.wm.addKeybinding( 'toggle-shortcut', this.settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.ALL, (() => {
                this.settings.set_boolean( 'dimming-enabled', ! this.settings.get_boolean( 'dimming-enabled' ) );
                this._process_windows();
            }));
        }));

        // Add a listener to react on the focus change
        this.on_global_focus_change = global.display.connect('notify::focus-window', (() => {
            this._process_windows();
        }));

        // Add a listener to react on the target monitor type change
        this.on_target_monitor_change = this.settings.connect( 'changed::target-monitor', (() => {
            this._process_windows();
        }));

        // Add a listener to react to the always-on-top setting change
        this.on_always_on_top_change = this.settings.connect( 'changed::dim-always-on-top', (() => {
            this._process_windows();
        }));

        // Add a listener to react to the maximized windows setting change
        this.on_maximized_windows_change = this.settings.connect( 'changed::dim-maximized', (() => {
            this._process_windows();
        }));

        // Add a listener to react to the tiled windows setting change
        this.on_tiled_windows_change = this.settings.connect( 'changed::dim-tiled', (() => {
            this._process_windows();
        }));

        // Add a listener to react on the background dimming setting change
        this.on_background_change = this.settings.connect( 'changed::dim-background', (() => {
            this._process_windows();
        }));

        // Add a listener to react to the overview being shown/hidden
        this.on_shown_overview = Main.overview.connect( 'shown', (() => {
            this._process_windows();
        }));
        this.on_hidden_overview = Main.overview.connect( 'hidden', (() => {
            this._process_windows();
        }));

        // Process all existing windows when the extension is enabled
        this._process_windows();
    }

    // The function called when the extension is disabled
    disable() {

        // Destroy the listeners for the overview
        if( this.on_shown_overview ) {
            Main.overview.disconnect( this.on_shown_overview );
            this.on_shown_overview = null;
        }
        if( this.on_hidden_overview ) {
            Main.overview.disconnect( this.on_hidden_overview );
            this.on_hidden_overview = null;
        }

        // Destroy the listener for the target monitor type change
        if( this.on_target_monitor_change ) {
            this.settings.disconnect( this.on_target_monitor_change );
            this.on_target_monitor_change = null;
        }

        // Destroy the listener for the always-on-top setting change
        if( this.on_always_on_top_change ) {
            this.settings.disconnect( this.on_always_on_top_change );
            this.on_always_on_top_change = null;
        }

        // Destroy the listener for the maximized windows setting change
        if( this.on_maximized_windows_change ) {
            this.settings.disconnect( this.on_maximized_windows_change );
            this.on_maximized_windows_change = null;
        }

        // Destroy the listener for the tiled windows setting change
        if( this.on_tiled_windows_change ) {
            this.settings.disconnect( this.on_tiled_windows_change );
            this.on_tiled_windows_change = null;
        }

        // Destroy the listener for the background dimming setting change
        if( this.on_background_change ) {
            this.settings.disconnect( this.on_background_change );
            this.on_background_change = null;
        }

        // Destroy the global display listener for the focus change
        if( this.on_global_focus_change ) {
            global.display.disconnect( this.on_global_focus_change );
            this.on_global_focus_change = null;
        }

        // Remove the toggle shortcut and its listener
        Main.wm.removeKeybinding( 'toggle-shortcut' );
        if( this.on_toggle_key ) {
            this.settings.disconnect( this.on_toggle_key );
            this.on_toggle_key = null;
        }

        // Loop on each window
        global.get_window_actors().forEach( ( window_actor ) => {
            // Disable the dim effect on the window
            this._disable_window_dimming( window_actor );
        });

        // Delete the settings objects
        this.interfaceSettings = null;
        this.gnomeSettings = null;
        this.settings = null;
    }

    // Determine if a window is dimmable based on its type
    _is_dimmable_type( meta_window ) {
        if( ! meta_window ) {
            return false;
        }
        const type = meta_window.get_window_type();
        return (
            type === Meta.WindowType.NORMAL ||
            type === Meta.WindowType.DIALOG ||
            type === Meta.WindowType.MODAL_DIALOG
        );
    }

    // Function to get the number of open windows on a specific monitor
    _get_num_displayed_windows_on_monitor( monitor_index ) {
        // Get all currently open windows (non-minimized)
        let windows = global.display.get_tab_list( Meta.TabList.NORMAL, null );

        let count = 0;
        windows.filter( ( window ) => {
            if( window.is_hidden() ||
                window.minimized ||
                window.get_monitor() !== monitor_index
            ) {
                return false;
            }
            count++;
            return true;
        });

        // Return the count of windows on this monitor
        return count;
    }

    // Process all windows to add/remove the dim effect
    _process_windows() {

        // Get the background actor - this is shared by all monitors
        const background_actor = Main.layoutManager._backgroundGroup;

        // Loop on all monitors
        // eslint-disable-next-line complexity
        Main.layoutManager.monitors.forEach( ( monitor, monitor_index ) => {

            // Get the number of displayed windows on this monitor (not hidden nor minimized)
            const num_windows = this._get_num_displayed_windows_on_monitor( monitor_index );
            //console.log('Monitor ' + monitor_index + ' - displayed windows: ' + num_windows);

            // FInd the background actor for this monitor
            // First get all background actors
            let background_actors = background_actor.get_children();
            //console.log('Background actors: ' + background_actors.length);
            // Then find the one that is on this monitor
            let monitor_background_actor = background_actors.find(actor => {
                let actor_monitor_index = Main.layoutManager.monitors.findIndex(monitor => {
                    return (
                        actor.get_allocation_box().x1 >= monitor.x &&
                        actor.get_allocation_box().x2 <= monitor.x + monitor.width &&
                        actor.get_allocation_box().y1 >= monitor.y &&
                        actor.get_allocation_box().y2 <= monitor.y + monitor.height
                    );
                });
                return actor_monitor_index === monitor_index;
            });

            // Skip if we don't find the background actor for this monitor
            if( monitor_background_actor === undefined ) {
                return;
            }

            // We don't want to enable the dim effect on the background if:
            // - the extension is internally toggled off
            // - the overview is visible
            // - there are no windows displayed
            // - the monitor is the primary monitor and the extension is configured to dim only windows on secondary monitors
            // - the monitor is a secondary monitor and the extension is configured to dim only windows on the primary monitor
            // - the background dimming is disabled
            if( this.settings.get_boolean( 'dimming-enabled' ) === false ||
                Main.overview.visible ||
                num_windows === 0 ||
                ( this.settings.get_string( 'target-monitor' ) === 'primary' && monitor_index !== Main.layoutManager.primaryIndex ) ||
                ( this.settings.get_string( 'target-monitor' ) === 'secondary' && monitor_index === Main.layoutManager.primaryIndex ) ||
                this.settings.get_boolean( 'dim-background' ) === false ) {
                // Disable the dim effect on the background
                if( monitor_background_actor.get_effect( 'dim' ) ) {
                    this._disable_window_dimming( monitor_background_actor );
                }
            } else {
                // Enable the dim effect on the background
                if( ! monitor_background_actor.get_effect( 'dim' ) ) {
                    this._enable_window_dimming( monitor_background_actor );
                }
            }
        });

        // Loop on all windows
        // eslint-disable-next-line complexity
        global.get_window_actors().forEach( ( window_actor ) => {

            const meta_window = window_actor.get_meta_window();
            if( ! meta_window ) {
                return;
            }

            // Exit if the window is not dimmable 
            if( ! this._is_dimmable_type( meta_window ) ) {
                return;
            }

            /* We don't want to dim the window if any of those conditions are met:
                * the window has the focus
                * the extension is internally toggled off
                * the overview is visible
                * the window is on the primary monitor and the extension is configured to dim only windows on secondary monitors
                * the window is on a secondary monitor and the extension is configured to dim only windows on the primary monitor
                * the window is marked as "always on top" and the extension is configured to not dim those windows
                * the window is maximized and the extension is configured to not dim those windows
                * the window is tiled and the extension is configured to not dim those windows - note: the tiling status is not exposed to extensions, so we use the work area to determine if the window is tiled - this will be less hackish when this is implemented: https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/1395
                * Note: Gnome 45.3 - as opposed to 45.2 and older - reports tiled windows correctly with the get_maximized() method, i.e. it returns 3 for maximized windows and 2 for vertically tiled windows (left or right) - apparently it's not possible to tile windows horizontally on top with Gnome 45.3, as it was possible with Gnome 45.2
            */

            // Some debugging info
            /*console.log( 'Window: ' + meta_window.get_title() + ' - Focus: ' + meta_window.has_focus() + ' - Above: ' + meta_window.is_above() + ' - Maximized: ' + meta_window.get_maximized() + ' - Tiled: ' + meta_window.get_maximized() + ' - Frame: ' + meta_window.get_frame_rect() + ' - Work area: ' + meta_window.get_work_area_current_monitor() );
            console.log( 'Focus window: ' + ( meta_window === global.display.get_focus_window() ) );
            console.log( 'Dimming enabled: ' + this.settings.get_boolean( 'dimming-enabled' ) + ' - Overview visible: ' + Main.overview.visible + ' - Target monitor: ' + this.settings.get_string( 'target-monitor' ) + ' - Always on top: ' + meta_window.is_above() + ' - Maximized: ' + meta_window.get_maximized() + ' - Tiled: ' + meta_window.get_maximized() + ' - Frame: ' + meta_window.get_frame_rect() + ' - Work area: ' + meta_window.get_work_area_current_monitor() );
            console.log( 'Dim effect: ' + window_actor.get_effect( 'dim' ) );*/

            if( meta_window.has_focus() ||
                this.settings.get_boolean( 'dimming-enabled' ) === false ||
                Main.overview.visible ||
                ( this.settings.get_string( 'target-monitor' ) === 'primary' && ! meta_window.is_on_primary_monitor() ) ||
                ( this.settings.get_string( 'target-monitor' ) === 'secondary' && meta_window.is_on_primary_monitor() ) ||
                ( this.settings.get_boolean( 'dim-always-on-top' ) === false && meta_window.is_above() ) ||
                ( this.settings.get_boolean( 'dim-maximized' ) === false && meta_window.get_maximized() === Meta.MaximizeFlags.BOTH ) ||
                ( this.settings.get_boolean( 'dim-tiled' ) === false && meta_window.get_maximized() === Meta.MaximizeFlags.HORIZONTAL ) ||
                ( this.settings.get_boolean( 'dim-tiled' ) === false && meta_window.get_maximized() === Meta.MaximizeFlags.VERTICAL ) ||
                ( this.settings.get_boolean( 'dim-tiled' ) === false && meta_window.get_maximized() !== Meta.MaximizeFlags.BOTH &&
                    (
                        (
                            meta_window.get_frame_rect().height === meta_window.get_work_area_current_monitor().height && (
                                meta_window.get_frame_rect().x === meta_window.get_work_area_current_monitor().x ||
                                meta_window.get_frame_rect().x - ( meta_window.get_work_area_current_monitor().x + meta_window.get_work_area_current_monitor().width / 2 ) <= 1
                            )
                        ) || (
                            meta_window.get_frame_rect().width === meta_window.get_work_area_current_monitor().width && (
                                meta_window.get_frame_rect().y === meta_window.get_work_area_current_monitor().y ||
                                meta_window.get_frame_rect().y - ( meta_window.get_work_area_current_monitor().x + meta_window.get_work_area_current_monitor().height / 2 ) <= 1
                            )
                        )
                    )
                )
            ) {
                // Do we have the dim effect?
                //console.log('Would disable dimming on window: ' + meta_window.get_title() );
                if( window_actor.get_effect( 'dim' ) ) {
                    //console.log('Disabling dimming on window: ' + meta_window.get_title() );
                    // Disconnect all listeners on this window
                    this._disable_window_dimming( window_actor );
                }
            // None of the above conditions are met, so we want to dim the window
            } else {
                //console.log('Would enable dimming on window: ' + meta_window.get_title() );
                // Don't we have the dim effect?
                if( ! window_actor.get_effect( 'dim' ) ) {
                    //console.log('Enabling dimming on window: ' + meta_window.get_title() );
                    // Connect all listeners on this window
                    this._enable_window_dimming( window_actor );
                }
            }
        });
    }

    // This function computes the brightness value to use depending on the night light and dark style settings
    _getBrightness() {
        let brightness;
        // Determine the brightness and saturation values to use, based on the night light and dark style settings
        // We need to check those settings in accordance with the brightness and saturation override settings of the extension

        // If the night light mode is enabled and if the brightness override setting is enabled
        if( this.gnomeSettings.get_boolean( 'night-light-enabled' ) && this.settings.get_boolean( 'brightness-night-light-override' ) ) {
            brightness = this.settings.get_double( 'brightness-night-light' );
        // else if the dark style is enabled and if the brightness override setting is enabled
        } else if( this.interfaceSettings.get_string( 'color-scheme' ) === 'prefer-dark' && this.settings.get_boolean( 'brightness-dark-style-override' ) ) {
            brightness = this.settings.get_double( 'brightness-dark-style' );
        } else {
            brightness = this.settings.get_double( 'brightness' );
        }
        return brightness;
    }

    // This function computes the saturation value to use depending on the night light and dark style settings
    _getSaturation() {
        let saturation;
        // Determine the saturation value to use, based on the night light and dark style settings
        // We need to check those settings in accordance with the saturation override settings of the extension

        // If the night light mode is enabled and if the saturation override setting is enabled
        if( this.gnomeSettings.get_boolean( 'night-light-enabled' ) && this.settings.get_boolean( 'saturation-night-light-override' ) ) {
            saturation = this.settings.get_double( 'saturation-night-light' );
        // else if the dark style is enabled and if the saturation override setting is enabled
        } else if( this.interfaceSettings.get_string( 'color-scheme' ) === 'prefer-dark' && this.settings.get_boolean( 'saturation-dark-style-override' ) ) {
            saturation = this.settings.get_double( 'saturation-dark-style' );
        } else {
            saturation = this.settings.get_double( 'saturation' );
        }
        return saturation;
    }

    // Function used to configure the dim effect - there is one per window - and to connect all listeners to the window
    _enable_window_dimming( window_actor ) {

        // Create the dim effect
        let effect = new this._DimWindowEffect( this._getBrightness(), this._getSaturation() );
        window_actor._effect = effect;
        window_actor.add_effect_with_name( 'dim', effect );

        // Listen to the brightness setting change
        window_actor._on_update_brightness = this.settings.connect( 'changed::brightness', () => {
            effect.set_brightness( this._getBrightness() );
        });

        // Listen to the brightness night light override toggle setting change
        window_actor._on_update_brightness_night_light_override = this.settings.connect( 'changed::brightness-night-light-override', () => {
            effect.set_brightness( this._getBrightness() );
        });
        // Listen to the brightness night light setting change
        window_actor._on_update_brightness_night_light = this.settings.connect( 'changed::brightness-night-light', () => {
            effect.set_brightness( this._getBrightness() );
        });
        // Listen to the brightness dark style override toggle setting change
        window_actor._on_update_brightness_dark_style_override = this.settings.connect( 'changed::brightness-dark-style-override', () => {
            effect.set_brightness( this._getBrightness() );
        });
        // Listen to the brightness dark style setting change
        window_actor._on_update_brightness_night_light = this.settings.connect( 'changed::brightness-dark-style', () => {
            effect.set_brightness( this._getBrightness() );
        });

        // Listen to the saturation setting change
        window_actor._on_update_saturation = this.settings.connect( 'changed::saturation', () => {
            effect.set_saturation( this._getSaturation() );
        });

        // Listen to the saturation night light override toggle setting change
        window_actor._on_update_saturation_night_light_override = this.settings.connect( 'changed::saturation-night-light-override', () => {
            effect.set_saturation( this._getSaturation() );
        });
        // Listen to the saturation night light setting change
        window_actor._on_update_saturation_night_light = this.settings.connect( 'changed::saturation-night-light', () => {
            effect.set_saturation( this._getSaturation() );
        });
        // Listen to the saturation dark style override toggle setting change
        window_actor._on_update_saturation_dark_style_override = this.settings.connect( 'changed::saturation-dark-style-override', () => {
            effect.set_saturation( this._getSaturation() );
        });
        // Listen to the saturation dark style setting change
        window_actor._on_update_saturation_dark_style = this.settings.connect( 'changed::saturation-dark-style', () => {
            effect.set_saturation( this._getSaturation() );
        });

        // Add a listener to react on the night light state change in the Gnome settings
        window_actor.on_night_light_change = this.gnomeSettings.connect( 'changed::night-light-enabled', (() => {
            effect.set_brightness( this._getBrightness() );
            effect.set_saturation( this._getSaturation() );
        }));

        // Add a listener to react on the dark style appearance change in the Gnome settings
        window_actor.on_color_scheme_change = this.interfaceSettings.connect( 'changed::color-scheme', (() => {
            effect.set_brightness( this._getBrightness() );
            effect.set_saturation( this._getSaturation() );
        }));
    }

    // Function used to delete the window effect and to disconnect all listeners from the window
    _disable_window_dimming( window_actor ) {

        // Remove the brightness update event listener
        if( window_actor._on_update_brightness ) {
            this.settings.disconnect( window_actor._on_update_brightness );
            delete window_actor._on_update_brightness;
        }

        // Remove the brightness night light override toggle setting change event listener
        if( window_actor._on_update_brightness_night_light_override ) {
            this.settings.disconnect( window_actor._on_update_brightness_night_light_override );
            delete window_actor._on_update_brightness_night_light_override;
        }
        // Remove the brightness night light setting change event listener
        if( window_actor._on_update_brightness_night_light ) {
            this.settings.disconnect( window_actor._on_update_brightness_night_light );
            delete window_actor._on_update_brightness_night_light;
        }
        // Remove the brightness dark style override toggle setting change event listener
        if( window_actor._on_update_brightness_dark_style_override ) {
            this.settings.disconnect( window_actor._on_update_brightness_dark_style_override );
            delete window_actor._on_update_brightness_dark_style_override;
        }
        // Remove the brightness dark style setting change event listener
        if( window_actor._on_update_brightness_dark_style ) {
            this.settings.disconnect( window_actor._on_update_brightness_dark_style );
            delete window_actor._on_update_brightness_dark_style;
        }

        // Remove the saturation update event listener
        if( window_actor._on_update_saturation ) {
            this.settings.disconnect( window_actor._on_update_saturation );
            delete window_actor._on_update_saturation;
        }

        // Remove the saturation night light override toggle setting change event listener
        if( window_actor._on_update_saturation_night_light_override ) {
            this.settings.disconnect( window_actor._on_update_saturation_night_light_override );
            delete window_actor._on_update_saturation_night_light_override;
        }
        // Remove the saturation night light setting change event listener
        if( window_actor._on_update_saturation_night_light ) {
            this.settings.disconnect( window_actor._on_update_saturation_night_light );
            delete window_actor._on_update_saturation_night_light;
        }
        // Remove the saturation dark style override toggle setting change event listener
        if( window_actor._on_update_saturation_dark_style_override ) {
            this.settings.disconnect( window_actor._on_update_saturation_dark_style_override );
            delete window_actor._on_update_saturation_dark_style_override;
        }
        // Remove the saturation dark style setting change event listener
        if( window_actor._on_update_saturation_dark_style ) {
            this.settings.disconnect( window_actor._on_update_saturation_dark_style );
            delete window_actor._on_update_saturation_dark_style;
        }

        // Destroy the listener for the color scheme change
        if( window_actor.on_color_scheme_change ) {
            this.interfaceSettings.disconnect( window_actor.on_color_scheme_change );
            delete window_actor.on_color_scheme_change;
        }

        // Destroy the listener for the night light state change
        if( window_actor.on_night_light_change ) {
            this.gnomeSettings.disconnect( window_actor.on_night_light_change );
            delete window_actor.on_night_light_change;
        }

        // Remove the dim effect
        if( window_actor.get_effect( 'dim' ) ) {
            window_actor.remove_effect_by_name( 'dim' );
        }
        // Delete the effect object for this window
        if( window_actor._effect ) {
            delete window_actor._effect;
        }
    }
        
}
