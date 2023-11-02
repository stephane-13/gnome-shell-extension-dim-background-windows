const Meta = imports.gi.Meta;
const GObject = imports.gi.GObject;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
//const Config = imports.misc.config;
const Clutter = imports.gi.Clutter;
const ExtensionUtils = imports.misc.extensionUtils;

// An object to store the extension settings later
let settings = null;
// An object to store the listener for new windows
let on_window_created = null;
// An object to store the listener for the overview being shown
let on_shown_overview = null;
// An object to store the listener for the overview being hidden
let on_hidden_overview = null;
// An object to store the listener for the toggle shortcut change
let on_toggle_key = null;
// An object to store the listener for the target monitor type change
let on_target_monitor_change = null;
// An object to store the listener for the always-on-top setting change
let on_always_on_top_change = null;
// An object to store the listener for the maximized windows setting change
let on_maximized_windows_change = null;
// An object to store the listener for the tiled windows setting change
let on_tiled_windows_change = null;



// The dim effect object
const DimWindowEffect = new GObject.registerClass(
    {
        GTypeName: 'DimWindowEffect',
    },
    class DimWindowEffect extends Clutter.ShaderEffect {
        constructor() {
            super();
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
            this.set_uniform_value( 'brightness', parseFloat( settings.get_double( 'brightness' ) - 1e-6 ) );
            this.set_uniform_value( 'saturation', parseFloat( settings.get_double( 'saturation' ) - 1e-6 ) );
            if (paint_node && paint_context)
                super.vfunc_paint_target(paint_node, paint_context);
            else if (paint_node)
                super.vfunc_paint_target(paint_node);
            else
                super.vfunc_paint_target();
        }
    }
);

function init() {
}

function enable() {

    // Get the extension settings
    settings = ExtensionUtils.getSettings();

    // Determine if a window is dimmable based on its type
    function is_dimmable( meta_window ) {
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

    // Process all windows to add/remove the dim effect based on their focus state
    function processWindows() {
        // Loop on all windows
        // eslint-disable-next-line complexity
        global.get_window_actors().forEach( function ( window_actor ) {

            const meta_window = window_actor.get_meta_window();
            if( ! meta_window ) {
                return;
            }
            // Ensure that the window has the focus event listener
            if( ! meta_window._on_focus ) {
                meta_window._on_focus = meta_window.connect( 'focus', on_focus );
            }
            // Exit if the window is not dimmable 
            if( ! is_dimmable( meta_window ) ) {
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
                * the window is tiled and the extension is configured to not dim those windows - note: the tiling status is not exposed to extensions (https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/1395), but in Gnome 42-44, the maximized state is 2 for tiled windows, so we can use that to detect tiled windows
            */
            if( meta_window.has_focus() ||
                settings.get_boolean( 'dimming-enabled' ) === false ||
                Main.overview.visible ||
                ( settings.get_string( 'target-monitor' ) === 'primary' && meta_window.is_on_primary_monitor() === 0 ) ||
                ( settings.get_string( 'target-monitor' ) === 'secondary' && meta_window.is_on_primary_monitor() !== 0 ) ||
                ( settings.get_boolean( 'dim-always-on-top' ) === false && meta_window.is_above() ) ||
                ( settings.get_boolean( 'dim-maximized' ) === false && meta_window.get_maximized() === Meta.MaximizeFlags.BOTH ) ||
                ( settings.get_boolean( 'dim-tiled' ) === false && meta_window.get_maximized() === Meta.MaximizeFlags.VERTICAL )
            ) {
                // Do we have the dim effect?
                if( window_actor.get_effect( 'dim' ) ) {
                    // Remove the brightness update event listener
                    if( window_actor._on_update_brightness ) {
                        settings.disconnect( window_actor._on_update_brightness );
                        delete window_actor._on_update_brightness;
                    }
                    // Remove the saturation update event listener
                    if( window_actor._on_update_saturation ) {
                        settings.disconnect( window_actor._on_update_saturation );
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
                    let effect = new DimWindowEffect();
                    window_actor._effect = effect;
                    window_actor.add_effect_with_name( 'dim', effect );
                    // Make sure the effect is updated immediately - and not just on next repaint - when parameters are updated in the preferences window
                    window_actor._on_update_brightness = settings.connect( 'changed::brightness', function () {
                        effect.set_uniform_value( 'brightness', parseFloat( settings.get_double( 'brightness' ) - 1e-6 ) );
                    });
                    window_actor._on_update_saturation = settings.connect( 'changed::saturation', function () {
                        effect.set_uniform_value( 'saturation', parseFloat( settings.get_double( 'saturation' ) - 1e-6 ) );
                    });
                }
            }
        });
    }

    // Focus event listener
    function on_focus( target_window ) {
        processWindows();
    }

    // New window event listener
    function window_created( display, target_window ) {
        // Add a focus event listener on the new window
        target_window._on_focus = target_window.connect( 'focus', on_focus );
    }

    // Enable the dimming effect, which could have been previsouly disabled by the keyboard shortcut
    settings.set_boolean( 'dimming-enabled', true );

    // Create a global keybinding to toggle the extension dimming effect
    Main.wm.addKeybinding( 'toggle-shortcut', settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.ALL, function () {
        settings.set_boolean( 'dimming-enabled', ! settings.get_boolean( 'dimming-enabled' ) );
        processWindows();
    });
    // Need a listener to update the keybinding when it is changed in the preferences window
    on_toggle_key = settings.connect( 'changed::toggle-shortcut', function () {
        Main.wm.removeKeybinding( 'toggle-shortcut' );
        Main.wm.addKeybinding( 'toggle-shortcut', settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.ALL, function () {
            settings.set_boolean( 'dimming-enabled', ! settings.get_boolean( 'dimming-enabled' ) );
            processWindows();
        });
    });
    // Add a listener to react on the target monitor type change
    on_target_monitor_change = settings.connect( 'changed::target-monitor', function () {
        processWindows();
    });

    // Add a listener to react to the always-on-top setting change
    on_always_on_top_change = settings.connect( 'changed::dim-always-on-top', function () {
        processWindows();
    });

    // Add a listener to react to the maximized windows setting change
    on_maximized_windows_change = settings.connect( 'changed::dim-maximized', function () {
        processWindows();
    });

    // Add a listener to react to the tiled windows setting change
    on_tiled_windows_change = settings.connect( 'changed::dim-tiled', function () {
        processWindows();
    });

    // Create a global display listener to react to new window events
    on_window_created = global.display.connect( 'window-created', window_created );

    // Add a listener to react to the overview being shown/hidden
    on_shown_overview = Main.overview.connect( 'shown', function () {
        processWindows();
    });
    on_hidden_overview = Main.overview.connect( 'hidden', function () {
        processWindows();
    });

    // Process all existing windows when the extension is enabled
    processWindows();
}

function disable() {

    // Destroy the listener for new windows
    if( on_window_created ) {
        global.display.disconnect( on_window_created );
        on_window_created = null;
    }

    // Destroy the listeners for the overview
    if( on_shown_overview ) {
        Main.overview.disconnect( on_shown_overview );
        on_shown_overview = null;
    }
    if( on_hidden_overview ) {
        Main.overview.disconnect( on_hidden_overview );
        on_hidden_overview = null;
    }

    // Destroy the listener for the target monitor type change
    if( on_target_monitor_change ) {
        settings.disconnect( on_target_monitor_change );
        on_target_monitor_change = null;
    }

    // Destroy the listener for the always-on-top setting change
    if( on_always_on_top_change ) {
        settings.disconnect( on_always_on_top_change );
        on_always_on_top_change = null;
    }

    // Destroy the listener for the maximized windows setting change
    if( on_maximized_windows_change ) {
        settings.disconnect( on_maximized_windows_change );
        on_maximized_windows_change = null;
    }

    // Destroy the listener for the tiled windows setting change
    if( on_tiled_windows_change ) {
        settings.disconnect( on_tiled_windows_change );
        on_tiled_windows_change = null;
    }

    // Remove the toggle shortcut and its listener
    Main.wm.removeKeybinding( 'toggle-shortcut' );
    if( on_toggle_key ) {
        settings.disconnect( on_toggle_key );
        on_toggle_key = null;
    }

    // Loop on each window
    global.get_window_actors().forEach( function ( window_actor ) {
        const meta_window = window_actor.get_meta_window();
        // Remove the listener for the focus event
        if( meta_window && meta_window._on_focus ) {
            meta_window.disconnect( meta_window._on_focus );
            delete meta_window._on_focus;
        }
        // Remove the brightness update event listener
        if( window_actor._on_update_brightness ) {
            settings.disconnect( window_actor._on_update_brightness );
            delete window_actor._on_update_brightness;
        }
        // Remove the saturation update event listener
        if( window_actor._on_update_saturation ) {
            settings.disconnect( window_actor._on_update_saturation );
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
    settings = null;
}
