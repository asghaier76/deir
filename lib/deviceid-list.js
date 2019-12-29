'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('../ledger-api/statelist.js');

const DeviceID = require('./deviceid.js');

class DeviceIDList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.deir.deviceidlist');
        this.use(DeviceID);
    }

    async addDeviceID(deviceid) {
        return this.addState(deviceid);
    }

    async getDeviceID(imei) {
        return this.getState(imei);
    }

    async updateDeviceID(deviceid) {
        return this.updateState(deviceid);
    }
}


module.exports = DeviceIDList;