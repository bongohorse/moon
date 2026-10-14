-- Cosmetic scene only. Physical bodies, joints and settings are never written here.
local terrain=require 'modules.terrain'
local sizes=require 'modules.mondpost_assets'
local M={}
local function tint(id,color) go.set(msg.url(nil,id,'sprite'),'tint',color) end
local function object(a,name,p,scale,z,color)
    p.z=z
    local id=factory.create('#'..name,p,nil,nil,vmath.vector3(scale,scale,1))
    a.count=a.count+1
    if color then tint(id,color) end
    return id
end
local function floor_object(a,name,x,y,scale,z)
    local spec=sizes[name]
    return object(a,name,vmath.vector3(x+(spec.w/2-spec.floor_x)*scale,
        y+(spec.floor_y-spec.h/2)*scale,0),scale,z)
end
local function clear_dust(a)
    a.dust_clock=0
    for _,p in ipairs(a.dust) do
        p.life=0; msg.post(msg.url(nil,p.id,'sprite'),'disable')
    end
end
function M.create()
    local a={count=0,stars={},ridges={},springs={},dust={},dust_clock=0,dust_index=0,emitted=0}
    for i=1,18 do
        local x=(i*173)%2100;local y=420+(i*79)%265
        local id=object(a,'star-sparkle',vmath.vector3(x,y,0),i%5==0 and .23 or .12,-.9,vmath.vector4(.82,.89,1,.75))
        a.stars[i]={id=id,x=x,y=y}
    end
    a.moon=object(a,'cratered-planet',vmath.vector3(1000,490,0),1,-.85)
    for layer=1,2 do
        for i=1,3 do
            local scale=layer==1 and 2 or 2.2
            local id=object(a,layer==1 and 'mountains-far' or 'mountains-near',vmath.vector3(),scale,-.8+layer*.1,
                layer==1 and vmath.vector4(.88,.88,1,.86) or vmath.vector4(.88,.88,.98,.9))
            if i%2==0 then sprite.set_hflip(msg.url(nil,id,'sprite'),true) end
            a.ridges[#a.ridges+1]={id=id,x=-500+(i-1)*1800,layer=layer}
        end
    end
    -- Preserve the existing exact terrain edge and closed mesh.
    for i=1,#terrain.points-1 do
        local p,q=terrain.points[i],terrain.points[i+1];local dx,dy=q[1]-p[1],q[2]-p[2]
        local length=math.sqrt(dx*dx+dy*dy)
        local id=factory.create('#pixel',vmath.vector3((p[1]+q[1])/2,(p[2]+q[2])/2,-.1),
            vmath.quat_rotation_z(math.atan2(dy,dx)),nil,vmath.vector3((length+2)/8,3/8,1))
        a.count=a.count+1;tint(id,vmath.vector4(.87,.84,.98,1))
    end
    for i=1,12 do
        local x=-300+i*330
        object(a,'moon-rocks',vmath.vector3(x,terrain.height(x)-48-(i*29)%105,0),.28+(i%3)*.09,-.05)
    end
    for i=1,10 do
        local x=-200+i*410
        object(a,'ground-details',vmath.vector3(x,terrain.height(x)-30-(i*19)%90,0),.45,-.04)
    end
    floor_object(a,'solar-station',3230,terrain.height(3230)-4,.9,-.3)
    floor_object(a,'finish-flag',terrain.finish,terrain.height(terrain.finish),1,.05)
    for i=1,2 do
        a.springs[i]=factory.create('#spring',vmath.vector3(0,0,.35));a.count=a.count+1
    end
    for i=1,8 do
        a.dust[i]={id=object(a,'moon-dust',vmath.vector3(),.1,.35),life=0}
    end
    clear_dust(a)
    return a
end
local function update_dust(a,state,vehicle,dt)
    if a.restart~=state.restarts or state.paused or state.finished then
        clear_dust(a);a.restart=state.restarts
    else
        dt=math.min(dt,.05)
        for _,p in ipairs(a.dust) do
            if p.life>0 then
                p.life=math.max(0,p.life-dt)
                if p.life==0 then msg.post(msg.url(nil,p.id,'sprite'),'disable')
                else
                    p.position.x=p.position.x+p.vx*dt;p.position.y=p.position.y+22*dt
                    go.set_position(p.position,p.id)
                    local age=1-p.life/.36
                    go.set_scale(vmath.vector3(.20+age*.22,.20+age*.22,1),p.id)
                    tint(p.id,vmath.vector4(1,1,1,.4*(1-age)))
                end
            end
        end
        a.dust_clock=math.min(.1,a.dust_clock+dt)
        if state.grounded and math.abs(state.speed)>80 and a.dust_clock>=.1 then
            -- Alternate wheels; an individual 26px probe must hit the track.
            local w=vehicle.wheels[a.dust_index%2+1];local point=go.get_position(w)
            if physics.raycast(point,point+vmath.vector3(0,-26,0),{hash('ground')}) then
                a.dust_clock=0;a.dust_index=a.dust_index+1
                local p=a.dust[(a.dust_index-1)%8+1]
                local direction=state.speed>0 and 1 or -1
                p.position=vmath.vector3(point.x-direction*15,point.y-13,.35)
                p.vx=-direction*18;p.life=.36;a.emitted=a.emitted+1
                go.set_position(p.position,p.id);go.set_scale(vmath.vector3(.2,.2,1),p.id)
                tint(p.id,vmath.vector4(1,1,1,.4));msg.post(msg.url(nil,p.id,'sprite'),'enable')
            end
        end
    end
    local live=0;for _,p in ipairs(a.dust) do if p.life>0 then live=live+1 end end
    return live
end
function M.update(a,state,vehicle,dt)
    local width,height=window.get_size();local view=720*width/math.max(height,1)
    for _,s in ipairs(a.stars) do
        go.set_position(vmath.vector3(state.camera_x+((s.x-state.camera_x*.06)%(view+200))-100,s.y+state.camera_y,-.9),s.id)
    end
    go.set_position(vmath.vector3(state.camera_x+view*.78-state.camera_x*.015,490+state.camera_y,-.85),a.moon)
    for _,r in ipairs(a.ridges) do
        go.set_position(vmath.vector3(state.camera_x+r.x-state.camera_x*(r.layer==1 and .12 or .24),
            (r.layer==1 and 330 or 265)+state.camera_y*(r.layer==1 and .95 or .85),-.8+r.layer*.1),r.id)
    end
    local p=go.get_position(vehicle.body);local rotation=go.get_rotation(vehicle.body)
    local minimum,maximum=math.huge,0
    for i,w in ipairs(vehicle.wheels) do
        -- Joint rest anchor is (±57,-46), axis (0,1), wheel anchor its center.
        -- A 38px cosmetic bracket on that same axis makes the shock visible.
        local anchor=p+vmath.rotate(rotation,vmath.vector3(i==1 and -57 or 57,-8,0))
        local wp=go.get_position(w);local delta=anchor-wp;local length=vmath.length(delta)
        local middle=(anchor+wp)*.5;middle.z=.35
        go.set_position(middle,a.springs[i])
        go.set_rotation(vmath.quat_rotation_z(math.atan2(delta.y,delta.x)-math.pi/2),a.springs[i])
        -- Prepared eye centers are 60 pixels apart, not the 84px canvas height.
        go.set_scale(vmath.vector3(.8,math.max(.01,length/60),1),a.springs[i])
        minimum=math.min(minimum,length);maximum=math.max(maximum,length)
    end
    state.graphics={dust=update_dust(a,state,vehicle,dt),emitted=a.emitted,sprites=a.count+20,
        spring_min=minimum,spring_max=maximum}
end
return M
