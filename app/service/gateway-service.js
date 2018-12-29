'use strict'

const lodash = require('lodash')
const Service = require('egg').Service
const {GatewayInfoUpdateEvent} = require('../enum/app-event-emitter-enum')

module.exports = class GatewayService extends Service {

    constructor({app}) {
        super(...arguments)
        this.apiRouterProvider = app.dal.apiRouterProvider
        this.clientInfoProvider = app.dal.clientInfoProvider
        this.serverGroupProvider = app.dal.serverGroupProvider
        this.httpComponentHandleRuleProvider = app.dal.httpComponentHandleRuleProvider
    }

    /**
     * 通过路由前缀获取路由列表
     * @param routerPrefix
     * @returns {Promise<*>}
     */
    async getRouterListByPrefix(routerPrefix, method) {

        const routerPrefixGroup = this.app.__cache__.routerPrefixGroup
        const routerPrefixRouters = routerPrefixGroup ? routerPrefixGroup[routerPrefix.toLowerCase()] : null

        if (!routerPrefixRouters) {
            return []
        }
        return routerPrefixRouters.reduce((acc, router) => {
            if (router.httpMethod.some(m => m.toUpperCase() === "ALL" || m.toUpperCase() === method)) {
                //克隆一个新对象,防止全局变量在后面被并发修改导致错误
                acc.push(lodash.cloneDeep(router))
            }
            return acc
        }, [])
    }

    /**
     * 获取所有的有效路由数据
     * @returns {Promise<void>}
     */
    async getAllRouterInfo() {

        const {app} = this
        const {apiRouterProvider, serverGroupProvider, clientInfoProvider, httpComponentHandleRuleProvider} = app.dal

        const task1 = apiRouterProvider.find({status: 1})
        const task2 = clientInfoProvider.find({status: 1})
        const task3 = serverGroupProvider.find({status: 1})
        const task4 = httpComponentHandleRuleProvider.find({status: 1})

        return Promise.all([task1, task2, task3, task4]).then(([routers, clientInfos, serverGroups, rules]) => {
            return this._buildRouterInfo(routers, clientInfos, serverGroups, rules)
        }).then(gatewayInfo => {
            //发送路由信息到所有的cluster-app上
            app.messenger.sendToApp(GatewayInfoUpdateEvent, gatewayInfo)
            return gatewayInfo
        })
    }

    /**
     * 组装路由信息
     * @param routers
     * @param clientInfos
     * @param serverGroups
     * @param rules
     */
    _buildRouterInfo(gatewayRouters, clientInfos, serverGroups, rules) {

        const gatewayInfo = {routers: [], clientInfo: {}, serverGroup: {}, httpComponentRule: {}}

        clientInfos.forEach(x => gatewayInfo.clientInfo[x.clientId] = x.toObject())
        serverGroups.forEach(x => gatewayInfo.serverGroup[x._id] = x.toObject())
        rules.forEach(x => gatewayInfo.httpComponentRule[x._id] = x.toObject())
        gatewayRouters.forEach(x => gatewayInfo.routers.push(x.toObject()))

        return gatewayInfo
    }
}