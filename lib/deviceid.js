'use strict';

// Utility class for ledger state
const State = require('../ledger-api/state.js');
const ByteFormat = require('./helpers/byte-format.js');


/**
 * Device class extends State class
 * Class will be used by application and smart contract to define a device
 */
class DeviceID extends State {

    constructor(obj) {
        /*we pass an array of attributes that make the device unique
         * The attributes hash can include any set of parameters
         * This can be IMSI or serial number or any other parameters
        */
        super(DeviceID.getClass(), [obj.imei]);
        Object.assign(this, obj);
    }


    /**
     * Basic getters and setters
    */

    /** Properties every device has */
    getPropertyList() {
        let identityFlag = {
            isActive: null,
            isStolen: null
        };

        let properties = {
            deviceIMEI: null,
            ownerAddress: null,
            attributesHash: null,
            firstBlockNumber: null,
            lastBlockNumber: null,
            identityFlag: identityFlag
        };
        return properties;
    }


    /** Device blockchain address */
    // getDeviceBlockchainAddress() {
    //     return this.deviceBlockchainAddress;
    // }

    // setDeviceBlockchainAddress(address) {
    //     this.deviceBlockchainAddress = address;
    // }

    /** Get Device Identity Details */
    getDeviceID(){
        return this;
    }

    /** Owner blockchain address */
    getOwnerAddress() {
        return this.ownerAddress;
    }

    setOwnerAddress(address) {
        this.ownerAddress = address;
    }

    /** Attributes hash */
    getAttributesHash() {
        return this.attributesHash;
    }

    setAttributesHash(hash) {
        this.attributesHash = hash;
    }

    /** First blocknumber */
    getFirstBlockNumber() {
        return this.firstBlockNumber;
    }

    // setFirstBlockNumber(blockNumber) {
    //     this.firstBlockNumber = blockNumber;
    // }

    /** Last blocknumber */
    getLastBlockNumber() {
        return this.lastBlockNumber;
    }

    setLastBlockNumber(blockNumber) {
        this.lastBlockNumber = blockNumber;
    }

    /** Start Identity flag
     *  needs to be compressed into a byte so getters and setters are more intricate */
    /** Active status */
    isActive() {
        let propertyList = this.getPropertyList();
        return ByteFormat.fromByte(this.identityFlag, propertyList.identityFlag).isActive;
    }

    /**
    * @param {Bool} status
    */
    setActive(status) {
        let propertyList = this.getPropertyList();
        //we pass the identityFlag byte, and get back an object
        let uncompressed = ByteFormat.fromByte(this.identityFlag, propertyList.identityFlag);
        uncompressed.isActive = status; //update the object
        let compressed = ByteFormat.toByte(uncompressed); //convert it back to byte
        this.identityFlag = compressed; //set device state
    }

    /** Stolen status */
    isStolen() {
        let propertyList = this.getPropertyList();
        return ByteFormat.fromByte(this.identityFlag, propertyList.identityFlag).isStolen;
    }

    /**
     * @param {Bool} status
     */
    setStolen(status) {
        let propertyList = this.getPropertyList();
        //we pass the identityFlag byte, and get back an object
        let uncompressed = ByteFormat.fromByte(this.identityFlag, propertyList.identityFlag);
        uncompressed.isStolen = status; //update the object
        let compressed = ByteFormat.toByte(uncompressed); //convert it back to byte
        this.identityFlag = compressed; //set device state
    }
    /** End Identity flag */
    /** End getters and setters */

    /**
     * @param {String} ownerAddress
     */
    isOwner(ownerAddress){
        return (ownerAddress === this.ownerAddress);
    }

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
    static createInstance(deviceIMEI, ownerAddress, attributesHash,
        firstBlockNumber, lastBlockNumber, identityFlag) {
        let compressedFlag = ByteFormat.toByte(identityFlag);
        return new Device({
            deviceIMEI, ownerAddress, attributesHash,
            firstBlockNumber, lastBlockNumber, compressedFlag
        });
    }

    static getClass() {
        return 'org.deir.deviceid';
    }
}

module.exports = Device;
