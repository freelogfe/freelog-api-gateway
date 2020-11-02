"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayConfigService = void 0;
const midway_1 = require("midway");
const lodash_1 = require("lodash");
let GatewayConfigService = class GatewayConfigService {
    constructor() {
        this._isSetGatewayInfo = false;
        this._routerMap = new Map();
        this._clientMap = new Map();
        this._routerPrefixGroup = new Map();
    }
    /**
     * 是否已设置路由配置
     */
    get isSetGatewayInfo() {
        return this._isSetGatewayInfo;
    }
    get latestUpdateDate() {
        return this._latestUpdateDate;
    }
    /**
     * 获取路由信息
     * @param routerId
     */
    getRouterInfo(routerId) {
        return lodash_1.cloneDeep(this._routerMap.get(routerId));
    }
    /**
     * 获取clientInfo
     * @param clientId
     */
    getClientInfo(clientId) {
        return lodash_1.cloneDeep(this._clientMap.get(clientId));
    }
    /**
     * 根据URL路由前缀获取路由分组信息
     * @param routerPrefix
     */
    getRouterListByPrefix(routerPrefix, httpMethod) {
        function filterHttpMethod(router) {
            return router.httpMethod.some(x => x.toUpperCase() === 'ALL' || x.toUpperCase() === httpMethod.toUpperCase());
        }
        return this._routerPrefixGroup.get(routerPrefix)?.filter(filterHttpMethod).map(lodash_1.cloneDeep) ?? [];
    }
    /**
     * 设置路由配置
     * @param routers
     * @param clientInfos
     * @param serverGroups
     * @param httpComponentHandleRules
     */
    setGatewayInfo(routers, clientInfos, serverGroups, httpComponentHandleRules) {
        if (![routers, clientInfos, serverGroups, httpComponentHandleRules].every(lodash_1.isArray)) {
            console.log('设置路由配置参数错误', routers, clientInfos, serverGroups, httpComponentHandleRules);
            return;
        }
        for (const router of routers) {
            router.httpComponentRules = [];
            for (const httpComponentRuleId of router.httpComponentRuleIds) {
                const httpComponentHandleRuleInfo = httpComponentHandleRules.find(x => x.ruleId === httpComponentRuleId);
                if (httpComponentHandleRuleInfo) {
                    router.httpComponentRules.push(httpComponentHandleRuleInfo);
                }
                else {
                    console.log('httpComponentRule not found,ruleId:' + httpComponentRuleId);
                    return false;
                }
            }
            router.routerPrefix = router.routerPrefix.toLowerCase();
            router.upstream.serverGroupInfo = serverGroups.find(x => x.groupName === router.upstream.serverGroupName);
            if (!router.upstream.serverGroupInfo) {
                console.log('serverGroup not found,serverGroupName:' + router.upstream.serverGroupName);
                return false;
            }
            if (!router.upstream.serverGroupInfo.servers?.some(x => x.status === 1)) {
                console.log('no servers are available', router.upstream.serverGroupInfo.servers);
                return false;
            }
        }
        return this.refreshGatewayConfig(routers, clientInfos);
    }
    /**
     * 数据正式写入到路由配置中
     * @param routers
     * @param clientInfos
     */
    refreshGatewayConfig(routers, clientInfos) {
        this._clientMap.clear();
        this._routerMap.clear();
        this._routerPrefixGroup.clear();
        for (const router of routers) {
            this._routerMap.set(router.routerId, router);
        }
        for (const clientInfo of clientInfos) {
            this._clientMap.set(clientInfo.clientId, clientInfo);
        }
        for (const [routerPrefix, routerGroup] of Object.entries(lodash_1.groupBy(routers, 'routerPrefix'))) {
            this._routerPrefixGroup.set(routerPrefix, routerGroup);
        }
        this._isSetGatewayInfo = true;
        this._latestUpdateDate = new Date();
        return true;
    }
};
GatewayConfigService = __decorate([
    midway_1.provide(),
    midway_1.scope(midway_1.ScopeEnum.Singleton)
], GatewayConfigService);
exports.GatewayConfigService = GatewayConfigService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2F0ZXdheS1jb25maWctc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9nYXRld2F5LWNvcmUvbGliL2dhdGV3YXktY29uZmlnLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsbUNBQWlEO0FBQ2pELG1DQUFtRDtBQVFuRCxJQUFhLG9CQUFvQixHQUFqQyxNQUFhLG9CQUFvQjtJQUFqQztRQUVZLHNCQUFpQixHQUFHLEtBQUssQ0FBQztRQUVqQixlQUFVLEdBQUcsSUFBSSxHQUFHLEVBQXNCLENBQUM7UUFDM0MsZUFBVSxHQUFHLElBQUksR0FBRyxFQUFzQixDQUFDO1FBQzNDLHVCQUFrQixHQUFHLElBQUksR0FBRyxFQUF3QixDQUFDO0lBNEcxRSxDQUFDO0lBMUdHOztPQUVHO0lBQ0gsSUFBSSxnQkFBZ0I7UUFDaEIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7SUFDbEMsQ0FBQztJQUVELElBQUksZ0JBQWdCO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO0lBQ2xDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxhQUFhLENBQUMsUUFBZ0I7UUFDMUIsT0FBTyxrQkFBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVEOzs7T0FHRztJQUNILGFBQWEsQ0FBQyxRQUFnQjtRQUMxQixPQUFPLGtCQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gscUJBQXFCLENBQUMsWUFBb0IsRUFBRSxVQUFrQjtRQUUxRCxTQUFTLGdCQUFnQixDQUFDLE1BQWtCO1lBQ3hDLE9BQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMs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