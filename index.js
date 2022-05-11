/*!
 * xprezzo-on-headers
 * Copyright(c) 2022 Cloudgen Wong <cloudgen.wong@gmail.com>
 * MIT Licensed
 */

'use strict'


/**
 * Set headers contained in array on the response object.
 *
 * @param {object} res
 * @param {array} headers
 * @private
 */
const setHeadersFromArray = (res, headers) => {
    for (let i = 0; i < headers.length; i++) {
      res.setHeader(headers[i][0], headers[i][1])
    }
}

/**
 * Set headers contained in object on the response object.
 *
 * @param {object} res
 * @param {object} headers
 * @private
 */

 const setHeadersFromObject = (res, headers) => {
    const keys = Object.keys(headers)
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i]
        if (k) res.setHeader(k, headers[k])
    }
}

/**
 * Set headers and other properties on the response object.
 *
 * @param {number} statusCode
 * @private
 */
function setWriteHeadHeaders (statusCode) {
    const length = arguments.length
    const headerIndex = length > 1 && typeof arguments[1] === 'string'
        ? 2
        : 1

    const headers = length >= headerIndex + 1
        ? arguments[headerIndex]
        : undefined

    this.statusCode = statusCode

    if (Array.isArray(headers)) {
        // handle array case
        setHeadersFromArray(this, headers)
    } else if (headers) {
        // handle object case
        setHeadersFromObject(this, headers)
    }

    // copy leading arguments
    const args = new Array(Math.min(length, headerIndex))
    for (let i = 0; i < args.length; i++) {
        args[i] = arguments[i]
    }

    return args
}

/**
 * Create a replacement writeHead method.
 *
 * @param {function} prevWriteHead
 * @param {function} listener
 * @private
 */

const createWriteHead = (prevWriteHead, listener) => {
    let fired = false

    // return function with core name and argument list
    return function (statusCode) {
        // set headers from arguments
        const args = setWriteHeadHeaders.apply(this, arguments)

        // fire listener
        if (!fired) {
            fired = true
            listener.call(this)

            // pass-along an updated status code
            if (typeof args[0] === 'number' && this.statusCode !== args[0]) {
                args[0] = this.statusCode
                args.length = 1
            }
        }

        return prevWriteHead.apply(this, args)
    }
}

/**
 * Module exports.
 * Execute a listener when a response is about to write headers.
 *
 * @param {object} res
 * @return {function} listener
 * @public
 */

module.exports = (res, listener) => {
    if (!res) {
        throw new TypeError('argument res is required')
    }

    if (typeof listener !== 'function') {
        throw new TypeError('argument listener must be a function')
    }

    res.writeHead = createWriteHead(res.writeHead, listener)
}
