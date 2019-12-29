'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('../ledger-api/statelist.js');

const IMEIRecord = require('./imeirecord.js');

class IMEIList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.deir.imeilist');
        this.use(IMEIRecord);
    }

    /** Used to add a device IMEI to the IMEIDB white/Blacklist */
    async addIMEIRecord(imeirecord) {
        return this.addState(imeirecord);
    }

    /** Used to retrieve a device IMEI record from the IMEIDB white/Blacklist */
    async getIMEIRecord(imei) {
        return this.getState(imei);
    }

    /** Used to update a device IMEI record in the IMEIDB white/Blacklist */
    async updateIMEIRecord(imeirecord) {
        return this.updateState(imeirecord);
    }
}


module.exports = IMEIList;