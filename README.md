# freelog-api-gateway 飞致网络网关服务

## 使用说明

### 路由配置说明
| 参数 | 说明 |
| :--- | :--- |
|routerPrefix|url前缀,一般获取urlPath的前两部分|
|routerUrlRule|路由规则,如果需要支持正则表达式,则通过${routerRegExp-index}来定位|
|routerRegExp|正则表达式,提供给路由规则使用,使用数组下标定位|
|httpMethod|支持的http请求方法|
|mockStatus|是否启动mock,如果启动,则需要参考mock相关配置|
|httpComponentProcessRules|http请求管道中的处理组件规则配置|
|upstream|上游服务器相关配置|

#### upstream配置说明
| 参数 | 说明 |
| :--- | :--- |
|protocol|请求上游服务器的协议头|
|port|请求上游服务器的端口|
|method|请求上游服务器的http method,为空则默认和当前请求的method|
|httpMethod|支持的http请求方法|
|serverGroupId| 上游服务器分组ID |
|forwardUriScheme|路由到上游服务器的路径.如果需要使用到匹配规则中的正则表达式匹配值,则通过${{index}}来获取,index为实际匹配到的正则值数组下标|


### 示例
```js
{
	"routerPrefix": "/v1/presentables/",
	"routerUrlRule": "/v1/presentables/${0}/",
	"routerRegExp": [
		"^[0-9a-f]{24}$"
	],
	"httpMethod": [
		"GET",
		"POST"
	],
	"httpComponentProcessRules": [],
	"upstream": {
    	"protocol": "http",
    	"port": 7005,
    	"method": null,
    	"serverGroupId": "5c175892e5c181401cd91988",
    	"forwardUriScheme": "/v1/presentables/${{0}}/"
    },
	"status": 1,
	"mockStatus": 0
}
```


### http管道处理组件规则配置说明

1.string值代表需要使用的组件名称
2.object值代表嵌套的规则.目前支持must和should关键字
3.must关键字代表内部的所有组件必须全部处理返回成功,则代表成功
4.should关键字代表内部任意的一个组件处理成功,则代表成功
5.must和should内部支持任意层级的嵌套


### 示例解析

1.jwt,internal-identity,null-identity任意一个组件返回成功,则终止本次should规则,然后进入must规则
2.must规则中client或ip-black-white-list任意一个返回成功,则跳出本次should规则,进行jwt-node处理
3.组件的实际执行顺序是按照数据的编码顺序依次执行的.should中执行成功,剩余则不再执行

### 示例
```js
{
		"should": [
			"jwt",
			"internal-identity",
			"null-identity"
		],
		"must": [
		    {
				"should": ["client", "ip-black-white-list"]
			},
			"jwt-node"
		]
	}
```