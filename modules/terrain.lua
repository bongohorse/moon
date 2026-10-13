local M = {}
-- Measured in design pixels; all collision geometry is static.
M.points={{-500,220},{500,220},{720,255},{930,220},{1180,310},{1460,230},
    {1700,230},{1920,345},{1990,345},{2110,230},{2380,230},
    {2580,165},{2800,165},{3030,230},{3700,230},{4080,230}}
M.finish=3600
function M.height(x)
    for i=1,#M.points-1 do
        local a,b=M.points[i],M.points[i+1]
        if x<=b[1] then return a[2]+(b[2]-a[2])*(x-a[1])/(b[1]-a[1]) end
    end
    return M.points[#M.points][2]
end
function M.create()
    for i=1,#M.points-1 do
        local a,b=M.points[i],M.points[i+1]
        local dx,dy=b[1]-a[1],b[2]-a[2]
        local angle=math.atan2(dy,dx)
        -- Preserve physical slab overlap; the separate render mesh shares these top edges.
        local pos=vmath.vector3((a[1]+b[1])/2+math.sin(angle)*16,
            (a[2]+b[2])/2-math.cos(angle)*16,-0.2)
        local id=factory.create('#ground',pos,vmath.quat_rotation_z(angle))
        local length=math.sqrt(dx*dx+dy*dy)+1
        physics.set_shape(msg.url(nil,id,'co'),'shape',{type=physics.SHAPE_TYPE_BOX,dimensions=vmath.vector3(length,32,10)})
        msg.post(msg.url(nil,id,'sprite'),'disable')
    end
end
return M
