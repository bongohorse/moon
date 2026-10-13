local M = {}
M.spec = {
    {key='gravity', label='Gravity', min=180, max=900, step=60, default=480},
    {key='torque', label='Motor torque', min=2, max=40, step=2, default=14},
    {key='speed', label='Wheel speed', min=8, max=40, step=2, default=24},
    {key='brake', label='Brake torque', min=5, max=80, step=5, default=45},
    {key='friction', label='Tire grip', min=0.2, max=3, step=0.2, default=1.5},
    {key='spring', label='Spring Hz', min=1, max=8, step=0.5, default=3.5},
    {key='damping', label='Damping ratio', min=0.1, max=1, step=0.1, default=0.7},
    {key='air', label='Air force', min=0, max=60, step=5, default=25},
}
function M.defaults()
    local t = {}; for _, s in ipairs(M.spec) do t[s.key] = s.default end; return t
end
function M.adjust(t, index, direction)
    local s = M.spec[index]
    t[s.key] = math.max(s.min, math.min(s.max, t[s.key] + s.step * direction))
end
function M.copy(t) local r = {}; for k,v in pairs(t) do r[k]=v end; return r end
return M
