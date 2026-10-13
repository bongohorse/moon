local M={}
function M.update(s,pos,dt,snap)
    local x=pos.x-420
    local y=math.max(0,pos.y-330)
    local a=snap and 1 or (1-math.exp(-8*math.min(dt,0.05)))
    s.camera_x=s.camera_x+(x-s.camera_x)*a
    s.camera_y=s.camera_y+(y-s.camera_y)*a
end
return M
