pbx = require('./libpbx.js')

let N = 215

pbx.init()
driv = pbx.driver('/dev/ttyS0')
chan = pbx.channel(0, pbx.CHANNEL_PROTOCOL_WS2812, pbx.CHANNEL_COMP_RGB, 1, 0, 2, 0, N)

buf = Buffer.alloc(N * 3, 0x01)
driv.write_channel(chan, buf)
driv.latch()

driv.close()
