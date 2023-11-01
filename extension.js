import Meta from 'gi://Meta';
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Shell from 'gi://Shell';
import Clutter from 'gi://Clutter';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class DimBackgroundWindowsExtension extends Extension {

    // The dim effect object
    _DimWindowEffect = new GObject.registerClass(
        {
            GTypeName: 'DimWindowEffect',
        },
        class DimWindowEffect extends Clutter.ShaderEffect {
            constructor( extensionSettings ) {
                super();
                this.settings = extensionSettings;
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

            vfunc_paint_target(paint_node = null, paint_context = null) {
                this.set_uniform_value( 'tex', 0 );
                this.set_uniform_value( 'brightness', parseFloat( this.settings.get_double( 'brightness' ) - 1e-6 ) );
                this.set_uniform_value( 'saturation', parseFloat( this.settings.get_double( 'saturation' ) - 1e-6 ) );
                if (paint_node && paint_context)
                    super.vfunc_paint_target(paint_node, paint_context);
                else if (paint_node)
                    super.vfunc_paint_target(paint_node);
                else
                    super.vfunc_paint_target();
            }
        }
    );

    // The function called when the extension is enabled
    enable() {

        // Get the extension settings
        this.settings = this.getSettings();
        // An object to store the listener for new windows
        this.on_window_created = null;
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

        // Enable the dimming effect, which could have been previsouly disabled by the keyboard shortcut
        this.settings.set_boolean( 'dimming-enabled', true );

        // Create a global keybinding to toggle the extension dimming effect
        Main.wm.addKeybinding( 'toggle-shortcut', this.settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.ALL, (() => {
            this.settings.set_boolean( 'dimming-enabled', ! this.settings.get_boolean( 'dimming-enabled' ) );
            this._processWindows();
        }));
        // Need a listener to update the keybinding when it is changed in the preferences window
        this.on_toggle_key = this.settings.connect( 'changed::toggle-shortcut', (() => {
            Main.wm.removeKeybinding( 'toggle-shortcut' );
            Main.wm.addKeybinding( 'toggle-shortcut', this.settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.ALL, (() => {
                this.settings.set_boolean( 'dimming-enabled', ! this.settings.get_boolean( 'dimming-enabled' ) );
                this._processWindows();
            }));
        }));
        // Add a listener to react on the target monitor type change
        this.on_target_monitor_change = this.settings.connect( 'changed::target-monitor', (() => {
            this._processWindows();
        }));

        // Add a listener to react to the always-on-top setting change
        this.on_always_on_top_change = this.settings.connect( 'changed::dim-always-on-top', (() => {
            this._processWindows();
        }));

        // Add a listener to react to the maximized windows setting change
        this.on_maximized_windows_change = this.settings.connect( 'changed::dim-maximized', (() => {
            this._processWindows();
        }));

        // Add a listener to react to the tiled windows setting change
        this.on_tiled_windows_change = this.settings.connect( 'changed::dim-tiled', (() => {
            this._processWindows();
        }));

        // Create a global display listener to react to new window events
        this.on_window_created = global.display.connect( 'window-created', this._update_on_window_created.bind(this) );

        // Add a listener to react to the overview being shown/hidden
        this.on_shown_overview = Main.overview.connect( 'shown', (() => {
            this._processWindows();
        }));
        this.on_hidden_overview = Main.overview.connect( 'hidden', (() => {
            this._processWindows();
        }));

        // Process all existing windows when the extension is enabled
        this._processWindows();
    }

    // The function called when the extension is disabled
    disable() {

        // Destroy the listener for new windows
        if( this.on_window_created ) {
            global.display.disconnect( this.on_window_created );
            this.on_window_created = null;
        }

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

        // Remove the toggle shortcut and its listener
        Main.wm.removeKeybinding( 'toggle-shortcut' );
        if( this.on_toggle_key ) {
            this.settings.disconnect( this.on_toggle_key );
            this.on_toggle_key = null;
        }

        // Loop on each window
        global.get_window_actors().forEach( ( window_actor ) => {
            const meta_window = window_actor.get_meta_window();
            // Remove the listener for the focus event
            if( meta_window && meta_window._on_focus ) {
                meta_window.disconnect( meta_window._on_focus );
                delete meta_window._on_focus;
            }
            // Remove the brightness update event listener
            if( window_actor._on_update_brightness ) {
                this.settings.disconnect( window_actor._on_update_brightness );
                delete window_actor._on_update_brightness;
            }
            // Remove the saturation update event listener
            if( window_actor._on_update_saturation ) {
                this.settings.disconnect( window_actor._on_update_saturation );
                delete window_actor._on_update_saturation;
            }
            // Remove the dim effect
            if( window_actor.get_effect( 'dim' ) ) {
                window_actor.remove_effect_by_name( 'dim' );
            }
            // Delete the effect object for this window
            if( window_actor._effect ) {
                delete window_actor._effect;
            }
        });

        // Delete the settings object
        this.settings = null;
    }

    // Determine if a window is dimmable based on its type
    _is_dimmable( meta_window ) {
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

    // Process all windows to add/remove the dim effect
    _processWindows() {

        // Loop on all windows
        // eslint-disable-next-line complexity
        global.get_window_actors().forEach( ( window_actor ) => {

            const meta_window = window_actor.get_meta_window();
            if( ! meta_window ) {
                return;
            }
            // Ensure that the window has the focus event listener
            if( ! meta_window._on_focus ) {
                meta_window._on_focus = meta_window.connect( 'focus', this._update_on_focus.bind( this ) );
            }
            // Exit if the window is not dimmable 
            if( ! this._is_dimmable( meta_window ) ) {
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
            */
            if( meta_window.has_focus() ||
                this.settings.get_boolean( 'dimming-enabled' ) === false ||
                Main.overview.visible ||
                ( this.settings.get_string( 'target-monitor' ) === 'primary' && meta_window.is_on_primary_monitor() === 0 ) ||
                ( this.settings.get_string( 'target-monitor' ) === 'secondary' && meta_window.is_on_primary_monitor() !== 0 ) ||
                ( this.settings.get_boolean( 'dim-always-on-top' ) === false && meta_window.is_above() ) ||
                ( this.settings.get_boolean( 'dim-maximized' ) === false && meta_window.get_maximized() === Meta.MaximizeFlags.BOTH ) ||
                ( this.settings.get_boolean( 'dim-tiled' ) === false && ! meta_window.get_maximized() &&
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
                if( window_actor.get_effect( 'dim' ) ) {
                    // Remove the brightness update event listener
                    if( window_actor._on_update_brightness ) {
                        this.settings.disconnect( window_actor._on_update_brightness );
                        delete window_actor._on_update_brightness;
                    }
                    // Remove the saturation update event listener
                    if( window_actor._on_update_saturation ) {
                        this.settings.disconnect( window_actor._on_update_saturation );
                        delete window_actor._on_update_saturation;
                    }
                    // Remove the dim effect
                    window_actor.remove_effect_by_name( 'dim' );
                    // Delete the effect object for this window
                    if( window_actor._effect ) {
                        delete window_actor._effect;
                    }
                }
            // None of the above conditions are met, so we want to dim the window
            } else {
                // Don't we have the dim effect?
                if( ! window_actor.get_effect( 'dim' ) ) {
                    // Dim it
                    let effect = new this._DimWindowEffect( this.settings );
                    window_actor._effect = effect;
                    window_actor.add_effect_with_name( 'dim', effect );
                    // Make sure the effect is updated immediately - and not just on next repaint - when parameters are updated in the preferences window
                    window_actor._on_update_brightness = this.settings.connect( 'changed::brightness', () => {
                        effect.set_uniform_value( 'brightness', parseFloat( this.settings.get_double( 'brightness' ) - 1e-6 ) );
                    });
                    window_actor._on_update_saturation = this.settings.connect( 'changed::saturation', () => {
                        effect.set_uniform_value( 'saturation', parseFloat( this.settings.get_double( 'saturation' ) - 1e-6 ) );
                    });
                }
            }
        });
    }

    // Focus event listener
    _update_on_focus( target_window ) {
        // Process all windows
        // Note: the focus state change of a window affects the dimming of the window loosing focus
        this._processWindows();
    }

    // New window event listener
    _update_on_window_created( display, target_window ) {
       // Add a focus event listener on the new window
        target_window._on_focus = target_window.connect( 'focus', this._update_on_focus.bind( this ) );
    }

}
