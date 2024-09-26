'use strict';
/*!
 * s1panel - sensor/clock
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */

const os = require("os");

var _last_sampled = 0;
var _date = new Date();
var _ipadr1 = '255.5255.255.255';
var _ipadr2 = '255.5255.255.255';
var _name = 'this node name';
var _ipAddresses = [];
var _uptime = 0;

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function getIPArry() {
    var ipAddresses = [];
    var interfaces = os.networkInterfaces();
    var intervaceIDs = Object.keys(interfaces);
    for ( let d = 0; d < intervaceIDs.length; d++) {
        var devName = intervaceIDs[d];
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                ipAddresses.push({ name: devName, value: alias.address});
            }
        }      
    }
    return ipAddresses;
}

function getupTime() {
    var uptime = '';
    let ut_sec = _uptime;
    let ut_min = ut_sec / 60;
    let ut_hour = ut_min / 60
    ut_sec = Math.floor(ut_sec);
    ut_min = Math.floor(ut_min);
    ut_hour = Math.floor(ut_hour);
    
    ut_hour = ut_hour % 60;
    ut_min = ut_min % 60;
    ut_sec = ut_sec % 60;
    uptime = ut_hour + ':' + pad(ut_min, 2) + ':' + pad(ut_sec, 2)
    return uptime;
}

function sample(rate, format) {

    return new Promise(fulfill => {

        const _diff = Math.floor(Number(process.hrtime.bigint()) / 1000000) - _last_sampled;

        if (!_last_sampled || _diff > rate) {

            _last_sampled = Math.floor(Number(process.hrtime.bigint()) / 1000000);
            _date = new Date();
            _uptime = os.uptime();
        }

        var _output = format.replace(/{(\d+)}/g, function (match, number) { 

            const _24hours = _date.getHours();
            const _minutes = _date.getMinutes();
            const _seconds = _date.getSeconds();
            const _uptimestr = getupTime();
            switch (number) {
                case '0':
                    return _24hours + ':' + pad(_minutes, 2) + ':' + pad(_seconds, 2);
                case '1':
                    return _name;
                case '2':
                    return _ipadr1;
                case '3':
                    return _ipadr2;
                case '4':
                    return _uptimestr;
                case '5': 
                    return _ipAddresses[0].name;
                case '6': 
                    return _ipAddresses[0].value;
                case '7': 
                    let _nic2 = '';
                    if (_ipAddresses.length > 1) {
                        _nic2 = _ipAddresses[1].name;
                    }
                    return _nic2;
                case '8': 
                    let _ip2 = '';
                    if (_ipAddresses.length > 1) {
                        _ip2 = _ipAddresses[1].value;
                    }
                    return _ip2;
                default:
                return 'undefined'; 
            }
        }); 

        fulfill({ value: _output, min: 0, max: 0 });
    });
}

function init(config) {
    _name = os.hostname();
    _ipAddresses = getIPArry();
    _ipadr1 = '';
    if (_ipAddresses.length > 0) {
        _ipadr1 = _ipAddresses[0].name + ':' + _ipAddresses[0].value;
    }
    _ipadr2 = '';
    if (_ipAddresses.length > 1) {
        _ipadr2 = _ipAddresses[1].name + ':' + _ipAddresses[1].value;
    }
    return 'device_info';
}

module.exports = {
    init,
    sample
};