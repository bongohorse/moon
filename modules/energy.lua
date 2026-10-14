local M={capacity=100,drain=4,charge_rate=20,charge_radius=350,max_charge_speed=70}
function M.new() return {battery=M.capacity,collected={},stars=0,charging=false,station=0} end
function M.step(e,stations,x,speed,grounded,gas,brake,paused,dt)
    e.charging=false;e.station=0;e.docking=false
    if paused then return end
    dt=math.max(0,math.min(dt,.05))
    for i,s in ipairs(stations) do
        if math.abs(x-s)<=M.charge_radius+600 then e.docking=true end
        if math.abs(x-s)<=M.charge_radius then
            e.station=i
            e.charging=grounded and math.abs(speed)<=M.max_charge_speed and (not gas or brake)
            break
        end
    end
    if e.charging then e.battery=math.min(M.capacity,e.battery+M.charge_rate*dt)
    elseif gas and not brake then e.battery=math.max(0,e.battery-M.drain*dt*(grounded and 1 or .5)) end
end
function M.collect(e,stars,x,y)
    for i,p in ipairs(stars) do
        if not e.collected[i] and (p[1]-x)^2+(p[2]-y)^2<=68^2 then
            e.collected[i]=true;e.stars=e.stars+1
        end
    end
end
function M.next_station(stations,x)
    for _,p in ipairs(stations) do if p>=x-M.charge_radius then return math.max(0,math.floor((p-x)/10)) end end
    return nil
end
return M
