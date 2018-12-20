'use strict'

const ComHandlerResult = require('../com-handle-result')
const {AuthenticationError} = require('egg-freelog-base/error')
const cryptoHelper = require('egg-freelog-base/app/extend/helper/crypto_helper')

module.exports = class JsonWebTokenAuthenticationComponent {

    constructor(app) {
        this.comName = "jwt"
        this.comType = "authentication"
        this.publicKey = app.config.RasSha256Key.identity.publicKey
    }

    /**
     * JWT普通用户认证
     */
    async handle(ctx) {

        const comHandlerResult = new ComHandlerResult(this.comName, this.comType)

        const jwtStr = ctx.cookies.get('authInfo') || ctx.get('authorization')
        if (!jwtStr) {
            comHandlerResult.error = new AuthenticationError('JWT认证失败,未获取到JWT信息')
            comHandlerResult.tips = "用户JWT认证失败"
            return comHandlerResult
        }

        const [header, payload, signature] = jwtStr.replace(/^Bearer $/, "").split('.')
        if (!header || !payload || !signature) {
            comHandlerResult.error = new AuthenticationError('JWT认证失败,数据规则校验失败')
            comHandlerResult.tips = "用户JWT数据校验失败"
            return comHandlerResult
        }

        const isVerify = cryptoHelper.rsaSha256Verify(`${header}.${payload}`, signature, this.publicKey)
        if (!isVerify) {
            comHandlerResult.error = new AuthenticationError('JWT认证失败,数据校验失败')
            comHandlerResult.tips = "用户JWT数据校验失败"
            return comHandlerResult
        }

        const payloadObject = JSON.parse(cryptoHelper.base64Decode(payload))
        if (payloadObject.expire < this._getExpire()) {
            comHandlerResult.error = new AuthenticationError('JWT认证失败,数据已过期')
            comHandlerResult.tips = "用户JWT数据校验失败"
            return comHandlerResult
        }

        comHandlerResult.handleResult = true
        comHandlerResult.attachData = payloadObject

        ctx.gatewayInfo.identityInfo.userInfo = payloadObject

        return comHandlerResult
    }

    /**
     * 获取有效期
     */
    _getExpire(expireSpan = 0) {
        const currTime = Math.round(new Date().getTime() / 1000)
        return currTime + expireSpan
    }
}

