local M={}
local function co(id) return msg.url(nil,id,'co') end
function M.create(settings)
    local p=vmath.vector3(180,294,0)
    local v={body=factory.create('#rover',p),wheels={},joints={},enabled=true}
    for i,x in ipairs({-57,57}) do
        local w=factory.create('#wheel',p+vmath.vector3(x,-46,0.2)); v.wheels[i]=w
        local body=b2d.get_body(co(w))
        b2d.shape.set_friction(b2d.body.get_shapes(body)[1].shape_id,settings.friction)
        v.joints[i]=b2d.joint.create_wheel(b2d.get_body(co(v.body)),body,{
            local_anchor_a=vmath.vector3(x,-46,0),local_anchor_b=vmath.vector3(),
            local_axis_a=vmath.vector3(0,1,0),enable_spring=true,enable_motor=true,
            motor_speed=0,max_motor_torque=settings.brake/0.01,
            frequency=settings.spring,damping=settings.damping})
        assert(b2d.joint.is_spring_enabled(v.joints[i]),'Wheel suspension must be enabled')
    end
    physics.set_gravity(vmath.vector3(0,-settings.gravity,0))
    return v
end
function M.destroy(v)
    for _,j in ipairs(v.joints) do b2d.joint.destroy(j) end
    go.delete(v.body); for _,w in ipairs(v.wheels) do go.delete(w) end
end
function M.enable(v,enabled)
    if v.enabled==enabled then return end
    v.enabled=enabled
    for _,id in ipairs({v.body,v.wheels[1],v.wheels[2]}) do msg.post(co(id),enabled and 'enable' or 'disable') end
end
function M.step(v,s,gas,brake,dt)
    local cfg=s.settings
    for _,j in ipairs(v.joints) do
        b2d.joint.enable_motor(j,gas or brake)
        b2d.joint.set_motor_speed(j,gas and -cfg.speed or 0)
        -- The supported low-level API scales project torque by physics.scale.
        b2d.joint.set_max_motor_torque(j,(brake and cfg.brake or cfg.torque)/0.01)
    end
    local grounded=false
    for _,w in ipairs(v.wheels) do
        local p=go.get_position(w)
        if physics.raycast(p,p+vmath.vector3(0,-29,0),{hash('ground')}) then grounded=true end
    end
    s.grounded=grounded
    if not grounded then
        s.air_frames=s.air_frames+1
        local direction=gas and 1 or (brake and -1 or 0)
        local spin=go.get(co(v.body),'angular_velocity').z
        if direction~=0 and math.abs(spin)<2.5 then
            local p=go.get_position(v.body)
            -- A bounded force couple applies physical torque, never pose animation.
            local arm=vmath.rotate(go.get_rotation(v.body),vmath.vector3(45,0,0))
            local forward=vmath.rotate(go.get_rotation(v.body),vmath.vector3(1,0,0))
            local angle=math.atan2(forward.y,forward.x)
            local control=math.max(-1,math.min(1,(direction*0.35-angle)*2-spin*0.8))
            local force=vmath.rotate(go.get_rotation(v.body),vmath.vector3(0,cfg.air*control,0))
            msg.post(co(v.body),'apply_force',{force=force/0.01,position=p+arm})
            msg.post(co(v.body),'apply_force',{force=-force/0.01,position=p-arm})
        end
    elseif v.was_air then s.landings=s.landings+1 end
    v.was_air=not grounded
    s.speed=go.get(co(v.body),'linear_velocity').x
    local wheel_local=vmath.rotate(vmath.conj(go.get_rotation(v.body)),go.get_position(v.wheels[1])-go.get_position(v.body))
    s.suspension=wheel_local.y+46
end
return M
