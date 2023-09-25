const Meta = imports.gi.Meta;
const GObject = imports.gi.GObject;
//const Main = imports.ui.main;
//const Config = imports.misc.config;
const Clutter = imports.gi.Clutter;
const ExtensionUtils = imports.misc.extensionUtils;

// An object to store the extension settings later
let settings = null;
// An object to store the listener for new windows later
let on_window_created = null;

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
            // Does the window have the focus?
            if( meta_window.has_focus() ) {
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
            // The window doesn't have the focus
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

    // Create a global display listener to react to new window events
    on_window_created = global.display.connect( 'window-created', window_created );

    // Process all existing windows when the extension is enabled
    processWindows();
}

function disable() {

    // Destroy the listener for new windows
    if( on_window_created ) {
        global.display.disconnect( on_window_created );
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
