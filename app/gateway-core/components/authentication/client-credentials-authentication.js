'use strict'

const moment = require("moment")
const ComHandlerResult = require('../com-handle-result')
const AuthenticationError = require('../../../error/AuthenticationError')
const {ArgumentError} = require('egg-freelog-base/error')
const cryptoHelper = require('egg-freelog-base/app/extend/helper/crypto_helper')

module.exports = class ClientCredentialsAuthenticationComponent {

    constructor(app) {
        this.comName = "client"
        this.clientInfoProvider = app.dal.clientInfoProvider
    }

    /**
     * client证书认证组件处理函数
     */
    async handle(ctx) {

        const comHandlerResult = new ComHandlerResult(this.comName)

        const clientId = ctx.checkHeader("clientid").notEmpty().toInt().value
        const timeLine = ctx.checkHeader("timeline").notEmpty().toInt().value
        const sign = ctx.checkHeader("sign").notEmpty().value

        if (ctx.errors.length) {
            comHandlerResult.error = new ArgumentError("参数校验错误", {clientId, timeLine, sign})
            comHandlerResult.tips = "参数校验失败,details" + JSON.stringify(ctx.errors)
            return comHandlerResult
        }

        if (Math.abs(moment().format('X') - timeLine) > 180) {
            comHandlerResult.error = new AuthenticationError("参数timeLine验证失败,timeLine校验不通过", {timeLine})
            comHandlerResult.tips = "客户端认证失败"
            return comHandlerResult
        }

        const clientInfo = await this.clientInfoProvider.findOne({clientId, status: 1})
        if (!clientInfo) {
            comHandlerResult.error = new AuthenticationError("client认证失败,未获取到有效的clientInfo", {clientId})
            comHandlerResult.tips = "客户端认证失败"
            return comHandlerResult
        }

        const text = url + "&timeline=" + timeLine
        if (cryptoHelper.hmacSha1(text, clientInfo.privateKey) !== sign) {
            comHandlerResult.error = new AuthenticationError("client认证失败,签名不匹配", {clientId})
            comHandlerResult.tips = "客户端认证失败,签名不匹配"
            return comHandlerResult
        }

        comHandlerResult.handleResult = true
        comHandlerResult.attachData = {clientInfo}

        ctx.gatewayInfo.identityInfo.clientInfo = clientInfo
        ctx.gatewayInfo.componentProcessResult.push(comHandlerResult)

        return comHandlerResult
    }
}

