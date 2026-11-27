- A portable ZIP plus a one-click launcher (`START-GODS-EYE-VIEW.bat` on
  Windows, `start-gods-eye-view.sh` elsewhere) runs the app without Pinokio or
  a terminal: it checks the Node version, installs locked dependencies on first
  run, picks a free port, starts the server on loopback only, and opens the
  browser, logging to `launcher/launch.log`.
