local config = require 'modules.config'
return {input=require('modules.input').new(), paused=false, finished=false,
    distance=0, pending=config.defaults(), settings=config.defaults(), dirty=false,
    camera_x=0, camera_y=0, restart=false, grounded=false, speed=0, suspension=0,
    restarts=0, air_frames=0, landings=0}
