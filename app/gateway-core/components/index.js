'use strict'

const Patrun = require('patrun')
const ComHandlerResult = require('./com-handle-result')
const {GatewayArgumentError} = require('egg-freelog-base/error')
const RouterTrafficStatisticsComponent = require('./other/traffic-statistics')
const RequestRecordHandlerComponent = require('./other/request-record-handler')
const JsonWebTokenAuthenticationComponent = require('./authentication/jwt-authentication')
const JsonWebTokenNodeAuthenticationComponent = require('./authentication/jwt-node-authentication')
const NullIdentityAuthenticationComponent = require('./authentication/null-identity-authentication')
const RefuseAllRequestAuthorizationComponent = require('./authorization/refuse-all-request-authorization')
const IpBlackWhiteListAuthenticationComponent = require('./authentication/ip-black-white-list-authentication')
const ClientCredentialsAuthenticationComponent = require('./authentication/client-credentials-authentication')
const ClientInternalIdentityAuthenticationComponent = require('./authentication/client-internal-identity-authentication')


module.exports = class ComponentHandler {

    constructor(app) {
        this.app = app
        this.patrun = Patrun()
        this._registerHttpComponents()
    }

    /**
     * 执行http组件
     * @param comName
     * @param ctx
     */
    async componentHandle(ctx, comName, comLevel, comConfig) {
        const component = this.patrun.find({comName})
        if (!component) {
            throw new GatewayArgumentError(`参数comName:${comName}错误,未找到对应的组件`)
        }
        if (component.comLevel !== comLevel) {
            return new ComHandlerResult(component.comName, component.comType, true)
        }
        return component.handle(ctx, comConfig)
    }

    /**
     * 注册http处理组件
     * @private
     */
    _registerHttpComponents() {

        const {app, patrun} = this

        const components = [
            new RequestRecordHandlerComponent(app),
            new RouterTrafficStatisticsComponent(app),
            new JsonWebTokenAuthenticationComponent(app),
            new NullIdentityAuthenticationComponent(app),
            new RefuseAllRequestAuthorizationComponent(app),
            new JsonWebTokenNodeAuthenticationComponent(app),
            new IpBlackWhiteListAuthenticationComponent(app),
            new ClientCredentialsAuthenticationComponent(app),
            new ClientInternalIdentityAuthenticationComponent(app)
        ]

        components.forEach(com => patrun.add({comName: com.comName}, com))
    }
}