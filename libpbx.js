var ref = require('ref-napi')
var refstruct = require('ref-struct-di')
var ffi = require('ffi-napi')

var _libpbx_driver_t = ref.types.void
var _libpbx_ws2812_chan_t = ref.types.void
var _libpbx_driver_t_ptr = ref.refType(_libpbx_driver_t)
var _libpbx_ws2812_chan_t_ptr = ref.refType(_libpbx_ws2812_chan_t)

var _libpbx = ffi.Library('libpbx',{
    'lx_pbx_init': [
        'int',
        [/* needs_wpi_setup */ 'int']
    ],
    'lx_pbx_driver_create': [
        'int',
        [/* device_file */'string',
         /* driver pointer; to empty struct */_libpbx_driver_t_ptr]
    ],
    'lx_pbx_driver_write_ws2812_chan': [
        'int',
        [/* driver pointer */_libpbx_driver_t_ptr,
         /* channel pointer */_libpbx_ws2812_chan_t_ptr,
         /* pixeldata (byte pointer) */ref.refType(ref.types.uint8),
         /* number of pixels */ref.types.size_t]
     ],
     'lx_pbx_driver_draw_accumulated': [
         'int',
         [/* driver pointer */_libpbx_driver_t_ptr]
     ],
     'lx_pbx_driver_destroy': [
         'int',
         [/* driver pointer */_libpbx_driver_t_ptr]
     ],
     'lx_pbx_open_channel_ws2812': [
         'int',
         [/* channel number */ref.types.uint8,
          /* channel pointer */ _libpbx_ws2812_chan_t_ptr,
          /* channel type */ref.types.uint8,
          /* red component index */ref.types.uint8,
          /* green component index */ref.types.uint8,
          /* blue component index */ref.types.uint8,
          /* white component index */ref.types.uint8]
     ],
     'lx_pbx_set_channel_comp_ws2812': [
         'int',
         [/* channel pointer */_libpbx_ws2812_chan_t_ptr,
          /* channel type */ref.types.uint8]
     ]
})

let CHANNEL_PROTOCOL_WS2812 = 1

let CHANNEL_COMP_DISABLED = 0
let CHANNEL_COMP_RGB = 3
let CHANNEL_COMP_RGBW = 4

var _pbx = {
    init: function (should_setup_wiringpi = true) {
        _libpbx.lx_pbx_init(should_setup_wiringpi ? 1 : 0)
    },
    _channel_size_for_protocol: function(channel_protocol) {
        switch(channel_protocol) {
            case CHANNEL_PROTOCOL_WS2812:
                return 48
            default:
                throw `unknown channel protocol ${channel_protocol}`
        }
    },
    driver: function(device_path) {
        driver = {
            inner: new Buffer(ref.types.int.size + ref.types.ulong.size),
            /* methods */
            close: function() {
                _libpbx.lx_pbx_driver_destroy(this.inner)
            },
            write_channel: function(channel, pixel_buffer) {
                switch(channel.protocol) {
                    case CHANNEL_PROTOCOL_WS2812:
                        _libpbx.lx_pbx_driver_write_ws2812_chan(
                            this.inner,
                            channel.inner,
                            pixel_buffer,
                            channel.length)
                        break
                    default:
                        throw `unknown channel protocol ${channel.protocol}`
                }
            },
            latch: function() {
                _libpbx.lx_pbx_driver_draw_accumulated(this.inner)
            }
        }
        _libpbx.lx_pbx_driver_create(device_path, driver.inner)
        return driver
    },
    channel: function(channel_number,
                           channel_protocol,
                           channel_composition,
                           red_index,
                           green_index,
                           blue_index,
                           white_index,
                           pixel_count) {
        channel = {
            protocol: channel_protocol,
            inner: new Buffer(_pbx.channel_size_for_protocol(channel_protocol)),
            length: pixel_count,
            /* METHODS */
            set_comp: function(channel_composition) {
                switch(channel.protocol) {
                    case CHANNEL_PROTOCOL_WS2812:
                        _libpbx.lx_pbx_set_channel_comp_ws2812(this.inner, channel_composition)
                        break
                    default:
                        throw `unknown channel protocol ${this.protocol}`
                }
            }
        }
        switch(channel.protocol) {
            case CHANNEL_PROTOCOL_WS2812:
                _libpbx.lx_pbx_open_channel_ws2812(
                    channel_number,
                    channel.inner,
                    channel_type,
                    red_index,
                    green_index,
                    blue_index,
                    white_index != undefined ? white_index : 0)
                return channel
            default:
                throw `unknown channel protocol ${channel_protocol}`
        }
    }
}

exports.init = _pbx.init
exports.driver = _pbx.driver
exports.channel = _pbx.channel
exports.CHANNEL_PROTOCOL_WS2812 = CHANNEL_PROTOCOL_WS2812
exports.CHANNEL_COMP_DISABLED = CHANNEL_COMP_DISABLED
exports.CHANNEL_COMP_RGB = CHANNEL_COMP_RGB
exports.CHANNEL_COMP_RGBW = CHANNEL_COMP_RGBW
