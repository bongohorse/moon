package.path='./?.lua;'..package.path
local input=require 'modules.input'
local config=require 'modules.config'
local terrain=require 'modules.terrain'
local energy=require 'modules.energy'
local n=0
local function check(ok,message) assert(ok,message); n=n+1 end
local s=input.new()
input.touch(s,1,'gas',false); input.touch(s,2,'brake',false)
local gas,brake=input.pedals(s); check(not gas and brake,'brake wins with two fingers')
input.touch(s,2,nil,true); gas,brake=input.pedals(s); check(gas and not brake,'release only second finger')
input.touch(s,1,'brake',false); gas,brake=input.pedals(s); check(brake and not gas,'drag transfers pedal')
s.keys.gas=true; input.clear(s); gas,brake=input.pedals(s); check(not gas and not brake,'focus clear resets all sources')
local c=config.defaults()
for i,spec in ipairs(config.spec) do
    for _=1,100 do config.adjust(c,i,1) end
    check(c[spec.key]==spec.max,'upper bound '..spec.key)
    for _=1,100 do config.adjust(c,i,-1) end
    check(c[spec.key]==spec.min,'lower bound '..spec.key)
end
local clone=config.copy(c); clone.gravity=999; check(c.gravity~=999,'copy isolates pending settings')
check(terrain.height(180)==220,'flat start')
check(terrain.height(3600)==175,'rounded crater floor')
check(terrain.height(terrain.finish)==230,'broad final landing zone')
check(terrain.finish<terrain.points[#terrain.points][1],'ground after finish')
check(terrain.finish-180>12000,'route is more than 1.2 km')
for _,x in ipairs(terrain.stations) do
    check(math.abs(terrain.height(x-140)-terrain.height(x+140))<.01,'charging platform is flat')
end
for i=2,#terrain.points-1 do
    local a,b,c=terrain.points[i-1],terrain.points[i],terrain.points[i+1]
    local left=(b[2]-a[2])/(b[1]-a[1]);local right=(c[2]-b[2])/(c[1]-b[1])
    check(math.abs(right-left)<.14,'bounded sampled curvature without sharp corners')
end
check(config.brake_torque(45,true,true,500)==6.5,'solar docking limits tipping torque')
check(config.brake_torque(45,true,false,500)==45,'normal braking unchanged')
check(config.brake_torque(45,false,true,500)==45,'air brake unchanged')
check(config.brake_torque(45,true,true,0)==45,'stationary parking brake unchanged')
check(config.brake_torque(5,true,true,-500)==5,'dock cap never increases selected brake torque')
local e=energy.new()
energy.step(e,terrain.stations,180,500,true,true,false,false,.05)
check(e.battery<100 and not e.charging,'motor uses energy')
local charge=e.battery
energy.step(e,terrain.stations,180,0,true,true,true,false,.05)
check(e.battery==charge,'brake priority does not drain battery')
energy.step(e,terrain.stations,2650,0,true,false,true,false,.05)
check(e.charging and e.battery>charge,'solar recharges stopped rover')
e.battery=50
energy.step(e,terrain.stations,2650,200,true,false,false,false,.05)
check(not e.charging and e.battery==50,'fast pass does not recharge')
energy.step(e,terrain.stations,2650,0,false,false,false,false,.05)
check(not e.charging,'airborne rover cannot charge')
energy.step(e,terrain.stations,2650,0,true,true,false,false,.05)
check(not e.charging and e.battery<50,'held gas prevents charging')
charge=e.battery
energy.step(e,terrain.stations,2650,0,true,false,true,true,.05)
check(e.battery==charge and not e.charging,'pause freezes battery')
e.battery=.01;energy.step(e,terrain.stations,180,200,true,true,false,false,.05)
check(e.battery==0,'energy never negative')
energy.step(e,terrain.stations,2650,0,true,false,false,false,100)
check(e.battery<=1,'large dt cannot fast-forward charging')
e.battery=99.9;energy.step(e,terrain.stations,2650,0,true,false,false,false,.05)
check(e.battery==100,'charge cannot exceed capacity')
energy.collect(e,terrain.stars,terrain.stars[1][1],terrain.stars[1][2])
energy.collect(e,terrain.stars,terrain.stars[1][1],terrain.stars[1][2])
check(e.stars==1,'collect once despite repeated overlap')
check(energy.new().stars==0 and energy.new().battery==100,'restart restores battery and collectibles')
-- Simulate Defold's deferred deletion to exercise streaming windows and long restarts.
local live,retired,next_id={}, {},0
local peak=0
vmath={vector3=function(x,y,z) return {x=x,y=y,z=z} end,quat_rotation_z=function(a) return a end}
math.atan2=math.atan2 or math.atan
factory={create=function(_,p,angle)
    next_id=next_id+1;live[next_id]={position=p,angle=angle}
    local count=0;for _ in pairs(live) do count=count+1 end
    peak=math.max(peak,count);assert(count+3<=128,'streamed colliders exceed engine budget')
    return next_id
end}
go={delete=function(id) retired[#retired+1]=id end}
msg={url=function(_,id) return id end}
physics={SHAPE_TYPE_BOX=1,set_shape=function(id,_,shape) live[id].shape=shape end}
local function retire() for _,id in ipairs(retired) do live[id]=nil end;retired={} end
local t=terrain.create();retire()
for x=180,12480,120 do
    terrain.update(t,x);retire()
    check(terrain.count(t)<=90,'bounded streamed collider window')
end
terrain.update(t,180);check(terrain.count(t)==0,'long restart retires old colliders first');retire()
terrain.update(t,180);check(terrain.count(t)>0,'next fixed step restores start collision window');retire()
check(peak+3<=128,'deferred collider peak stays within engine cap')
print(string.format('Streaming collider peak including rover: %d',peak+3))
print(string.format('%d assertions passed',n))
