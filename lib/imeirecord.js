'use strict';

// Utility class for ledger state
const State = require('../ledger-api/state.js');
const ByteFormat = require('./helpers/byte-format.js');


/**
 * IMEIRecord class extends State class
 * Class will be used by application and smart contract to define imei record in imeidb
 */
class IMEIRecord extends State {

    constructor(obj) {
        /* we pass the IMEI as the device unique identifier */
        super(IMEIRecord.getClass(), [obj.imei]);
        Object.assign(this, obj);
    }


    /** 
     * Properties of an IMEI record inn imeidb 
    */
    getPropertyList() {
        let statusFlag = {
            isBlacklisted: null,
            isGraylisted: null,
            isWhitelisted: null
        };

        let properties = {
            imei: null,
            imsi: null,
            timestamp: null,
            statusFlag: statusFlag
        };
        return properties;
    }


    /** Get IMEI Record Details */
    getIMEIRecord(){
        return this;
    }

    /** Owner blockchain address */
    getTimestamp() {
        return this.timestamp;
    }

    setTimestamp(timestamp) {
        this.timestamp = timestamp;
    }


    /**
    * @param {Bool} status
    */
    setBlacklistedStatus(status) {
        let propertyList = this.getPropertyList();
        //we pass the statusFlag byte, and get back an object
        let uncompressed = ByteFormat.fromByte(this.statusFlag, propertyList.statusFlag);
        uncompressed.isBlacklisted = status; //update the object
        let compressed = ByteFormat.toByte(uncompressed); //convert it back to byte
        this.statusFlag = compressed; //set record state
    }

    /**
     * @param {Bool} status
     */
    setGraylistedStatus(status) {
        let propertyList = this.getPropertyList();
        //we pass the statusFlag byte, and get back an object
        let uncompressed = ByteFormat.fromByte(this.statusFlag, propertyList.statusFlag);
        uncompressed.isGraylisted = status; //update the object
        let compressed = ByteFormat.toByte(uncompressed); //convert it back to byte
        this.statusFlag = compressed; //set record state
    }

    /**
     * @param {Bool} status
     */
    setWhitelistedStatus(status) {
        let propertyList = this.getPropertyList();
        //we pass the statusFlag byte, and get back an object
        let uncompressed = ByteFormat.fromByte(this.statusFlag, propertyList.statusFlag);
        uncompressed.isWhitelisted = status; //update the object
        let compressed = ByteFormat.toByte(uncompressed); //convert it back to byte
        this.statusFlag = compressed; //set record state
    }
    
    /** End getters and setters */

    static fromBuffer(buffer) {
        return Device.deserialize(buffer);
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to device
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, Device);
    }

    /**
     * Factory method to create a device object
     */
    static createInstance(imei, imsi, timestamp, statusFlag) {
        let compressedFlag = ByteFormat.toByte(statusFlag);
        return new IMEIRecord({ imei, imsi, timestamp, compressedFlag });
    }

    static getClass() {
        return 'org.deir.imeirecord';
    }
}

module.exports = IMEIRecord;
