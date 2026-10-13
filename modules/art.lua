-- Cosmetic objects only. No collision objects or simulation writes.
local terrain=require 'modules.terrain'
local M={}
local function sprite_at(image,p,w,h,z,color)
    p.z=z
    local id=factory.create('#pixel',p)
    sprite.play_flipbook(msg.url(nil,id,'sprite'),image)
    go.set_scale(vmath.vector3(w,h,1),id)
    if color then go.set(msg.url(nil,id,'sprite'),'tint',color) end
    return id
end
function M.create()
    local a={stars={},ridges={},springs={}}
    for i=1,45 do
        local x=(i*173)%2100; local y=360+(i*79)%335; local size=i%9==0 and 2.2 or 1.1
        local id=sprite_at('pixel',vmath.vector3(x,y,0),size/8,size/8,-.9,vmath.vector4(.75,.77,.91,.65))
        a.stars[i]={id=id,x=x,y=y}
    end
    a.moon=sprite_at('moon',vmath.vector3(1000,490,0),1.1,1.1,-.85)
    for layer=1,2 do
        for i=1,6 do
            local id=sprite_at(layer==1 and 'ridge-far' or 'ridge-near',vmath.vector3(),1.15,1.15,-.8+layer*.1)
            a.ridges[#a.ridges+1]={id=id,x=(i-1)*588.8,layer=layer}
        end
    end
    -- Exact continuous surface line over the single closed mesh.
    for i=1,#terrain.points-1 do
        local p,q=terrain.points[i],terrain.points[i+1];local dx,dy=q[1]-p[1],q[2]-p[2]
        local length=math.sqrt(dx*dx+dy*dy)
        local id=sprite_at('pixel',vmath.vector3((p[1]+q[1])/2,(p[2]+q[2])/2,0),(length+2)/8,3/8,-.1,vmath.vector4(.87,.84,.98,1))
        go.set_rotation(vmath.quat_rotation_z(math.atan2(dy,dx)),id)
    end
    -- Rocks sit below the driving edge: decorative, never obstacles.
    for i=1,24 do
        local x=-450+i*180;local y=terrain.height(x)-34-(i*29)%140
        local scale=.45+(i%4)*.18
        sprite_at('rock',vmath.vector3(x,y,0),scale,scale,-.05,vmath.vector4(1,1,1,.8))
    end
    for i=1,2 do a.springs[i]=factory.create('#spring',vmath.vector3(0,0,.15)) end
    return a
end
function M.update(a,state,vehicle)
    local width,height=window.get_size();local view=720*width/math.max(height,1)
    for _,s in ipairs(a.stars) do
        go.set_position(vmath.vector3(state.camera_x+((s.x-state.camera_x*.06)%(view+200))-100,s.y+state.camera_y,-.9),s.id)
    end
    go.set_position(vmath.vector3(state.camera_x+view*.78-state.camera_x*.015,490+state.camera_y,-.85),a.moon)
    for _,r in ipairs(a.ridges) do
        local span=588.8*6;local x=state.camera_x+((r.x-state.camera_x*(r.layer==1 and .12 or .24))%span)-588.8
        go.set_position(vmath.vector3(x,(r.layer==1 and 365 or 275)+state.camera_y*(r.layer==1 and .95 or .85),-.8+r.layer*.1),r.id)
    end
    local p=go.get_position(vehicle.body)
    for i,w in ipairs(vehicle.wheels) do
        local anchor=p+vmath.rotate(go.get_rotation(vehicle.body),vmath.vector3(i==1 and -34 or 34,-8,0))
        local wp=go.get_position(w);local delta=anchor-wp;local middle=(anchor+wp)*.5;middle.z=.15
        go.set_position(middle,a.springs[i]);go.set_rotation(vmath.quat_rotation_z(math.atan2(delta.y,delta.x)-math.pi/2),a.springs[i])
        go.set_scale(vmath.vector3(1,vmath.length(delta)/64,1),a.springs[i])
    end
end
return M
