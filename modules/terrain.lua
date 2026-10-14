local data=require 'modules.level_data'
local M={points=data.points,finish=data.finish,stations=data.stations,stars=data.stars}
function M.height(x)
    for i=1,#M.points-1 do
        local a,b=M.points[i],M.points[i+1]
        if x<=b[1] then return a[2]+(b[2]-a[2])*(x-a[1])/(b[1]-a[1]) end
    end
    return M.points[#M.points][2]
end
-- Only nearby static slabs exist. They use precisely the same sampled top edges as both meshes.
function M.update(t,x)
    if t.x and math.abs(x-t.x)>1100 then
        -- go.delete is deferred. Retire the distant window for one fixed step before
        -- allocating the start window after a long-route restart; no collider peak.
        for i,id in pairs(t.active) do go.delete(id);t.active[i]=nil end
        t.x=nil;return
    end
    if t.x and math.abs(x-t.x)<120 then return end
    t.x=x
    for i,id in pairs(t.active) do
        if M.points[i+1][1]<x-250 or M.points[i][1]>x+600 then go.delete(id);t.active[i]=nil end
    end
    for i=1,#M.points-1 do
        local a,b=M.points[i],M.points[i+1]
        if b[1]>=x-250 and a[1]<=x+600 and not t.active[i] then
            local dx,dy=b[1]-a[1],b[2]-a[2];local angle=math.atan2(dy,dx)
            local pos=vmath.vector3((a[1]+b[1])/2+math.sin(angle)*16,(a[2]+b[2])/2-math.cos(angle)*16,-.2)
            local id=factory.create('#ground',pos,vmath.quat_rotation_z(angle))
            physics.set_shape(msg.url(nil,id,'co'),'shape',{type=physics.SHAPE_TYPE_BOX,dimensions=vmath.vector3(math.sqrt(dx*dx+dy*dy)+.8,32,10)})
            t.active[i]=id
        end
    end
end
function M.create() local t={active={}};M.update(t,180);return t end
function M.count(t) local n=0;for _ in pairs(t.active) do n=n+1 end;return n end
return M
