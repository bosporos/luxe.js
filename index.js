pbx = require('./libpbx.js')

let N = 215
//
// pbx.init()
// driv = pbx.driver('/dev/ttyS0')
// chan = pbx.channel(0, pbx.CHANNEL_PROTOCOL_WS2812, pbx.CHANNEL_COMP_RGB, 1, 0, 2, 0, N)
//
buf = Buffer.alloc(N * 3, 0x01)
// driv.write_channel(chan, buf)
// driv.latch()
//
// driv.close()

l = pbx._libpbx
l.lx_pbx_init(1)
d = Buffer.alloc(12, 0)
l.lx_pbx_driver_create('/dev/ttyS0', d)
c = Buffer.alloc(6, 0)
l.lx_pbx_open_channel_ws2812(0, c, 3, 1, 0, 2, 0)
l.lx_pbx_driver_write_ws2812_chan(d, c, buf, N)
l.lx_pbx_driver_draw_accumulated(d)
l.lx_pbx_driver_destroy(d)
