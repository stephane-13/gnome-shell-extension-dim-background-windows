# Gnome Shell Extension - Dim Background Windows
A gnome shell extension dimming background / non-focused windows.
The brightness and saturation of background windows can be tweaked in the extension preferences.

# Compatibility

This extension has only been tested on Ubuntu 22.04 using Gnome / Wayland.
Gnome versions 42 to 44 should be supported.

This extension shouldn't conflict with any other extension.
It simply adds an effect - a GLSL fragment shader - to alter the brightness and saturation of background windows.
It reacts on new window and focus events and doesn't do anything outside of those events.

# Similar Extensions

I found this one, which seems old and not maintained anymore (but might still work on older Gnome versions):
> https://extensions.gnome.org/extension/650/shade-inactive-windows

# Installation

To install the extension, visit its page on the official Gnome Extensions page:
> https://extensions.gnome.org/extension/6313/dim-background-windows/

To install the extension manually, one can download the zip file and execute:
```
gnome-extensions install dim-background-windows@stephane-13.github.com.shell-extension.zip
```

To package the extension locally - for example to test a code patch - clone this git repository and execute:
```
gnome-extensions pack .
```
This will generate the zip file above, which can then be installed (use the --force flag if a previous version of the extension is already installed).
Logout / login is usually required to see the code changes effect.

# License
This software comes with no license. Use at your own risk. Reuse / modify / distribute it without any restriction.

