# Description

Replace a standard remote control for RC boats with:
  * Dedicated Wifi hotspot (access via phone/tablet/PC)
  * Control through a webpage with:
    * RC control buttons (forward, backward, left, right)
    * Onboard video streaming 
 
Based on:
  * Raspberry Pi web server, controlling onboard GPIO/Servo/Motor & Camera
  * Onboard video streaming is accessible for anybody connected to open PiBoat wifi
  * NodeJS with pi-blaster

This guide was written for beginers (in Raspberry, GPIO, Servo, ...) with detailed instructions.
Expect costs of about 100€ and ~10 hours to install & configure it.


# Result

<table><tr><td>
<img src="_README/TODO_TUBE.jpg" width="400">
</td><td>
<img src="_README/TODO_LAKE.jpg" width="400">
</td></tr></table>

<img src="_README/TODO_LAKE_VIDEO.gif" width="400">


# Raspberry Pi Setup

1. [Setup Raspberry Pi Zero W](https://michaelmuenzer.medium.com/get-started-with-your-raspberry-pi-zero-6cfc80321680)
2. [Setup camera module](https://michaelmuenzer.medium.com/put-glasses-on-to-your-raspberry-pi-zero-8eea55eb36c9)
3. [Connect pi-blaster and ESC](https://michaelmuenzer.medium.com/use-pi-blaster-to-run-esc-and-servo-motor-from-a-raspberry-pi-38aa1c7a1e6e)
5. Control boat from within the web-browser
4. Setup Wifi AP


# Use it

  * Plug the boat battery on the ESC
  * Plug the battery pack on the Pi Zero
  * Turn the ESC on, so it powers the motor
  * Wait about 1 minute that the Pi Zero starts its web app and wifi hotspot
  * Connect your phone to the "PiCruise" wifi hotspot
  * Open http://raspberrypi.local:8082/ in your phone browser
  * Control it using left/right/top/bottom buttons and see onboard view in real-time (expect less than .5 seconds delay)