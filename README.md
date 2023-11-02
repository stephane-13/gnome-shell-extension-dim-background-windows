# Gnome Shell Extension- Dim Background Windows - Version 9 for Gnome 45
A gnome shell extension dimming background / non-focused windows.
The brightness and saturation of background windows can be tweaked in the extension preferences.

# Compatibility

This extension has only been tested on Ubuntu 23.10 using Gnome / Wayland.
Gnome version 45 should be supported.

This extension shouldn't conflict with any other extension.
It simply adds an effect - a GLSL fragment shader - to alter the brightness and saturation of background windows.
It reacts on window creation and focus events as well as when the overview is shown or hidden. It doesn't do anything outside of those events.

# Similar Extensions

I found this one, which seems old and not maintained anymore (but might still work on older Gnome versions):
> https://extensions.gnome.org/extension/650/shade-inactive-windows

# Installation

To install the extension, visit its page on the official Gnome Extensions page:
> https://extensions.gnome.org/extension/6313/dim-background-windows/

To install the latest development version of the extension manually, one can download the zip file available above and execute:
```
gnome-extensions install dim-background-windows@stephane-13.github.com.shell-extension.zip
```
Please note that the latest code in this repository might be pending validation on extensions.gnome.org, which has the latest stable version.
The code in the main branch is considered stable, but not yet ready for production until it's been validated by extensions.gnome.org.

To package the extension locally - for example to test a code patch - clone this git repository and execute:
```
gnome-extensions pack .
```
This will generate the zip file above, which can then be installed (use the --force flag if a previous version of the extension is already installed).
Logout / login is usually required to see the code changes effect.

# Versions History
- Version 10 : Gnome 42 to 44 - Added options to control the dimming effect on maximized and tiled windows
- Version  9 : Gnome 45       - Added options to control the dimming effect on maximized and tiled windows
- Version  8 : identical to version 7, but for Gnome 45
- Version  7 : Added an option to apply the dimming effect only to the primary monitor, only to the secondary monitor(s) or to all monitors.
               Also added an option to enable or disable the dimming effect for windows marked as always on top.
- Version  6 : Disabled dimming effect in overview mode.
- Version  5 : Implemented configurable shortcut to toggle the dimming effect.
- Version  4 : First validated version.

# License
This software comes with no license. Use at your own risk. Reuse / modify / distribute it without any restriction.
