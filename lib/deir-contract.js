'use strict';

// Fabric API smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// deviceID and IMEIRecords classes
const DeviceID = require('./deviceid.js');
const DeviceIDList = require('./deviceid-list.js');
const IMEIRecord = require('./imeirecord.js');
const IMEIList = require('./imei-list.js');

// uuid generator
const uuidv1 = require('uuid/v1');


/**
 * A custom context provides easy access to list of all devices
 */
class DEIRContext extends Context {

    constructor() {
        super();
        // All devices are held in a list of devices
        this.deviceidList = new DeviceIDList(this);
        this.imeiList = new IMEIList(this);
    }

}

/**
 * Define DEIR smart contract by extending Fabric Contract class
 *
 */
class DEIRContract extends Contract {

    constructor() {
        // Unique name when multiple contracts per chaincode file
        super('org.deir.deircontract');
    }

    /**
     * Define a custom context for DEIR
    */
    createContext() {
        return new DEIRContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        // No implementation of contract instantiaion at this stage
    }


   /**
     * Issue deviceID on ledger
     *
     * @param {Context} ctx the transaction context
     * @param {String} imei device's imei
     * @param {String} ownerAddress owner's address
     * @param {String} attributesHash unique hash of the device
     * @param {String} identityFlag flag of several device statuses (stringified Object)
    */
    async issueDeviceID(ctx, imei, attributesHash, identityFlag, ownerAddress) {
        let firstBlockNumber = ctx.stub.getTxID();
        let lastBlockNumber = firstBlockNumber; // when ID first issued they are the same
        let deviceIMEI = imei; //unique imei is used


        // create an instance of the device
        let deviceid = DeviceID.createInstance(deviceIMEI, ownerAddress, attributesHash,
            firstBlockNumber, lastBlockNumber, JSON.parse(identityFlag));

        // Add the device to the list of all devices in the ledger world state
        await ctx.deviceidList.addDeviceID(deviceid);

        // define and set GraylistedEvent
        let newIdentityEvent = {
            type: "New Identity",
            imei: imei,
            owner: ownerAddress,
            attributesHash: attributesHash,
            timestamp: firstBlockNumber
        };

        await ctx.stub.setEvent('NewIdentityEvent', Buffer.from(JSON.stringify(newIdentityEvent)));

        // Must return a serialized deviceid to caller of smart contract
        return deviceid;
    }


    /**
     * Update deviceID on ledger
     *
     * @param {Context} ctx the transaction context
     * @param {String} imei device's imei
     * @param {String} callerAddress address of entity making the request
     * @param {String} attributesHash unique hash of the device
     * @param {String} identityFlag flag of several device statuses (stringified Object)
    */
    async updateDeviceID(ctx, imei, attributesHash, identityFlag, callerAddress) {
        let blockNumber = ctx.stub.getTxID();

        // fetch an instance of the deviceid and check that Device has been issued an ID before
        let deviceid = await ctx.deviceidList.getDeviceID(imei);

        if (deviceid === null) {
            throw new Error('This device has not been registered and issued ID on the blockchain');
        }

        // assert it's the owner making the request.
        if (device.isOwner(callerAddress) === false) {
            throw new Error('The caller is not allowed to make this change');
        }

        deviceid.setLastBlockNumber(blockNumber);
        deviceid.setAttributesHash(attributesHash);
        
        // Add the device to the list of all similar devices in the ledger world state
        await ctx.deviceidList.updateDeviceID(deviceid);

        // Must return a serialized deviceid to caller of smart contract
        return deviceid;
    }

    /**
     * Get deviceID 
     *
     * @param {Context} ctx the transaction context
     * @param {String} imei device's imei
    */
   async getDeviceID(ctx, imei) {

    // fetch an instance of the deviceid and check that Device has been issued an ID before
    let deviceid = await ctx.deviceidList.getDeviceID(imei);

    if (deviceid === null) {
        throw new Error('This device has not been registered and issued ID on the blockchain');
    }

    // Return a serialized deviceid to caller of smart contract
    return deviceid;
}


    /**
    * set Whitelist status of device
    *
    * @param {Context} ctx the transaction context
    * @param {String} callerAddress address of entity making the request
    * @param {String} imei - the unique id of the device
    * @param {String} imsi
    * @param {String} status true or false
    */
    async setWhitelistStatus(ctx, callerAddress, imei, imsi, status) {
        let blockNumber = ctx.stub.getTxID();
        if (status !== 'true' && status !== 'false') {
            throw new Error('Status must either be true or false');
        }
        status = status === 'true' ? true : false;// convert from truthy to explicit

        // fetch an instance of the deviceid and check that Device has been issued an ID before
        let deviceid = await ctx.deviceidList.getDeviceID(imei);

        if (deviceid === null) {
            throw new Error('This device has not been registered and issued ID on the blockchain');
        }

        // assert it's the owner making the request.
        if (device.isOwner(callerAddress) === false) {
            throw new Error('The caller is not allowed to make this change');
        }

        // fetch an instance of the imei record
        let imeirecord = await ctx.imeiList.getIMEIRecord(imei);

        if (imeirecord === null) { // if no previous record create new one
            // create an instance of the imei record
            let statusFlag = {
                isBlacklisted: null,
                isGraylisted: null,
                isWhitelisted: status
            };
            imeirecord = IMEIRecord.createInstance(imei, imsi, blockNumber, statusFlag);

            // Add the imei record to the imei list in the ledger world state
            await ctx.imeiList.addIMEIRecord(imeirecord);
            
        } else { // if there is a record then update it
            //update imei record properties
            imeirecord.setTimestamp(blockNumber);
            imeirecord.setWhitelistedStatus(status);

            // Update the imei list
            await ctx.imeiList.updateIMEIRecord(imeirecord);
        }

        // define and set GraylistedEvent
        let statusUpdateEvent = {
            type: "Status Update",
            imei: imei,
            caller: callerAddress,
            timestamp: blockNumber,
            statusUpdate: 'Whitelisted'
        };

        await ctx.stub.setEvent('StatusUpdateEvent', Buffer.from(JSON.stringify(statusUpdateEvent)));

        // Return a serialized record to the caller of smart contract
        return imeirecord;
    }

    /**
    * set Blacklisted status of device
    *
    * @param {Context} ctx the transaction context
    * @param {String} callerAddress address of entity making the request
    * @param {String} imei - the unique id of the device
    * @param {String} imsi
    * @param {String} status true or false  */
    async setBlacklistedStatus(ctx, callerAddress, imei, imsi, status) {
        let blockNumber = ctx.stub.getTxID();
        if (status !== 'true' && status !== 'false') {
            throw new Error('Status must either be true or false');
        }
        status = status === 'true' ? true : false;// convert from truthy to explicit

        // fetch an instance of the deviceid and check that Device has been issued an ID before
        let deviceid = await ctx.deviceidList.getDeviceID(imei);

        if (deviceid === null) {
            throw new Error('This device has not been registered and issued ID on the blockchain');
        }

        // assert it's the owner making the request.
        if (device.isOwner(callerAddress) === false) {
            throw new Error('The caller is not allowed to make this change');
        }

        // fetch an instance of the imei record
        let imeirecord = await ctx.imeiList.getIMEIRecord(imei);

        if (imeirecord === null) { // if no previous record create new one
            // create an instance of the imei record
            let statusFlag = {
                isBlacklisted: status,
                isGraylisted: null,
                isWhitelisted: null
            };
            imeirecord = IMEIRecord.createInstance(imei, imsi, blockNumber, statusFlag);

            // Add the imei record to the imei list in the ledger world state
            await ctx.imeiList.addIMEIRecord(imeirecord);
            
        } else { // if there is a record then update it
            //update imei record properties
            imeirecord.setTimestamp(blockNumber);
            imeirecord.setBlacklistedStatus(status);

            // Update the imei list
            await ctx.imeiList.updateIMEIRecord(imeirecord);
        }

        // define and set GraylistedEvent
        let statusUpdateEvent = {
            type: "Status Update",
            imei: imei,
            caller: callerAddress,
            timestamp: blockNumber,
            statusUpdate: 'Blacklisted'
        };

        await ctx.stub.setEvent('StatusUpdateEvent', Buffer.from(JSON.stringify(statusUpdateEvent)));

        // Return a serialized record to the caller of smart contract
        return imeirecord;
    }

    /**
    * set Graylisted status of device
    *
    * @param {Context} ctx the transaction context
    * @param {String} callerAddress address of entity making the request
    * @param {String} imei - the unique id of the device
    * @param {String} imsi
    * @param {String} status true or false  */
    async setGraylistedStatus(ctx, callerAddress, imei, imsi, status) {
        let blockNumber = ctx.stub.getTxID();
        if (status !== 'true' && status !== 'false') {
            throw new Error('Status must either be true or false');
        }
        status = status === 'true' ? true : false;// convert from truthy to explicit

        // fetch an instance of the deviceid and check that Device has been issued an ID before
        let deviceid = await ctx.deviceidList.getDeviceID(imei);

        if (deviceid === null) {
            throw new Error('This device has not been registered and issued ID on the blockchain');
        }

        // assert it's the owner making the request.
        if (deviceid.isOwner(callerAddress) === false) {
            throw new Error('The caller is not allowed to make this change');
        }

        // fetch an instance of the imei record
        let imeirecord = await ctx.imeiList.getIMEIRecord(imei);

        if (imeirecord === null) { // if no previous record create new one
            // create an instance of the imei record
            let statusFlag = {
                isBlacklisted: null,
                isGraylisted: status,
                isWhitelisted: null
            };
            imeirecord = IMEIRecord.createInstance(imei, imsi, blockNumber, statusFlag);

            // Add the imei record to the imei list in the ledger world state
            await ctx.imeiList.addIMEIRecord(imeirecord);
            
        } else { // if there is a record then update it
            //update imei record properties
            imeirecord.setTimestamp(blockNumber);
            imeirecord.setGraylistedStatus(status);

            // Update the imei list
            await ctx.imeiList.updateIMEIRecord(imeirecord);
        }

        // define and set GraylistedEvent
        let statusUpdateEvent = {
            type: "Status Update",
            imei: imei,
            caller: callerAddress,
            timestamp: blockNumber,
            statusUpdate: 'Graylisted'
        };

        await ctx.stub.setEvent('StatusUpdateEvent', Buffer.from(JSON.stringify(statusUpdateEvent)));

        // Return a serialized record to the caller of smart contract
        return imeirecord;
    }

    /**
    * Change Ownership of device
    *
    * @param {Context} ctx the transaction context
    * @param {String} imei - the device unique id
    * @param {String} callerAddress address of current owner
    * @param {String} newOwnerAddress address of new owner
    */
    async changeOwner(ctx, imei, callerAddress, newOwnerAddress) {
        let lastBlockNumber = ctx.stub.getTxID();
        if (newOwnerAddress === '' || typeof newOwnerAddress === 'undefined') {
            throw new Error('New owner address must be defined');
        }

        // fetch an instance of the device
        let deviceid = await ctx.deviceidList.getDeviceID(imei);

        if (deviceid === null) {
            throw new Error('This device is not registered on the blockchain');
        }

        // assert it's the owner making the request.
        if (deviceid.isOwner(callerAddress) === false) {
            throw new Error('The caller is not allowed to make this change');
        }

        //update deviceid properties
        deviceid.setLastBlockNumber(lastBlockNumber);
        deviceid.setOwnerAddress(newOwnerAddress);

        // Update the device
        await ctx.deviceidList.updateDeviceID(deviceid);

        // define and set OwnershipChangeEvent
        let ownershipEvent = {
            type: "Ownership Change",
            imei: imei,
            previousOwner: callerAddress,
            newOwner: newOwnerAddress,
            timestamp: lastBlockNumber
        };

        await ctx.stub.setEvent('OwnershipChangeEvent', Buffer.from(JSON.stringify(ownershipEvent)));

        // Must return a serialized deviceid to caller of smart contract
        return deviceid;
    }

}

module.exports = DEIRContract;
