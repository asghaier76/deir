'use strict';

/**
 * A helper utility class
 */

class ByteFormat {
    /**
     * convert an attribute to byte format for storage.
    */
    static toByte(properties) {
        let byteArray = Array(8).fill(0);
        let bitPosition = 7; //start from the end
        let byte = 0;

        for (let property in properties) {
            byteArray[bitPosition] = (properties[property] === true || properties[property] === 'true') ? 1 : 0;
            bitPosition--;
        }
        byte = parseInt(byteArray.join(''), 2);
        return byte;
    }


    /**
     * convert from byte for human readable
    */
    static fromByte(int, structure) {
        let bitPosition = 7;
        let byte = this._int2bin(int); // '00000010'
        for (let property in structure) {
            structure[property] = byte.charAt(bitPosition) === '1' ? true : false;
            bitPosition--;
        }

        return structure;
    }


    /**
     * convert from integer to binary byte
    */
    static _int2bin(int) {
        //_naming convention for 'private' member
        return (int >>> 0).toString(2).padStart(8, 0);
    }
}

module.exports = ByteFormat;