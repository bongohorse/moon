local M = {}
function M.new() return {keys={}, touches={}} end
function M.clear(s) s.keys={}; s.touches={} end
function M.pedals(s)
    local gas, brake = s.keys.gas or false, s.keys.brake or false
    for _, pedal in pairs(s.touches) do
        gas = gas or pedal == 'gas'; brake = brake or pedal == 'brake'
    end
    return gas and not brake, brake -- braking wins, including air rotation
end
function M.touch(s, id, pedal, released)
    if released then s.touches[id]=nil else s.touches[id]=pedal end
end
return M
