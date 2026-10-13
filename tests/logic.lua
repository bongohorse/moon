package.path='./?.lua;'..package.path
local input=require 'modules.input'
local config=require 'modules.config'
local terrain=require 'modules.terrain'
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
check(terrain.height(2700)==165,'crater floor')
check(terrain.height(3500)==230,'broad landing zone')
check(terrain.finish<terrain.points[#terrain.points][1],'ground after finish')
print(string.format('%d assertions passed',n))
