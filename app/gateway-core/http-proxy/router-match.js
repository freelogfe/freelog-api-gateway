'use strict'

const lodash = require('lodash')
const customParamRegExp = /^:[a-zA-Z0-9_]{1,100}$/
const {GatewayRouterMatchError} = require('egg-freelog-base/error')

module.exports = class GatewayUrlRouterMatch {

    constructor(app) {
        //this.serverGroupProvider = app.dal.serverGroupProvider
    }

    /**
     * 获取上游路由信息
     * @param routerList
     */
    async matchRouterInfo(routerList, path) {

        if (!path.endsWith('/')) {
            path = path + '/'
        }

        if (!routerList.length) {
            return null
        }

        const matchRouterInfo = lodash.chain(routerList).map(router => this._getRouterMatchScore(router, path)).orderBy('matchScore', 'desc').first().value()

        return matchRouterInfo.matchScore <= 0 ? null : matchRouterInfo
    }

    /**
     * 获取上游服务器路由信息
     */
    async getUpstreamInfo(routerInfo, url, method) {

        const {upstream} = routerInfo

        upstream.forwardUri = this._getUpstreamRouterUrl(routerInfo, url)
        upstream.method = upstream.method || method
        upstream.serverInfo = upstream.serverGroupInfo.servers.find(x => x.status === 1)

        if (!upstream.serverInfo) {
            throw new GatewayRouterMatchError('没有可路由的上游服务器', {url, upstream})
        }

        return upstream
    }

    /**
     * 计算路由匹配分值
     */
    _getRouterMatchScore(routerObject, urlPath) {

        let matchScore = 0
        const router = lodash.clone(routerObject)  //克隆一个新对象,防止全局变量在后面被并发修改导致错误

        const urlPathSchemes = lodash.trim(urlPath, '/').split('/')
        const routerSchemes = lodash.trim(router.routerUrlRule, '/').split('/')

        if (urlPathSchemes.length < routerSchemes.length) {
            router.matchScore = matchScore
            return router
        }

        const routerUrl = [""], customParamsMap = new Map()
        for (let i = 0, j = routerSchemes.length; i < j; i++) {
            if (routerSchemes[i].toLowerCase() === urlPathSchemes[i].toLowerCase()) {
                matchScore += 1
                routerUrl.push(routerSchemes[i])
            }
            else if (customParamRegExp.test(routerSchemes[i])) {
                matchScore += 0.99
                routerUrl.push(urlPathSchemes[i])
                customParamsMap.set(routerSchemes[i].substring(1), urlPathSchemes[i])
            }
            else {
                matchScore = 0
                break
            }
        }
        router.matchScore = matchScore
        router.routerUrl = routerUrl.join("/")
        router.customParamsMap = customParamsMap

        return router
    }

    /**
     * 获取上游路由URL
     */
    _getUpstreamRouterUrl(routerInfo, url) {

        const {forwardUriScheme} = routerInfo.upstream
        const upstreamRouterUrl = forwardUriScheme.split('/').map(segment => {
            if (customParamRegExp.test(segment)) {
                return routerInfo.customParamsMap.has(segment.substring(1)) ? routerInfo.customParamsMap.get(segment.substring(1)) : ''
            } else {
                return segment
            }
        }).join("/")

        return url.replace(new RegExp(lodash.trimEnd(routerInfo.routerUrl, '/'), "i"), lodash.trimEnd(upstreamRouterUrl, '/'))
    }
}