import { MongooseModelBase, IMongooseModelBase } from './mongoose-model-base';
export declare class HttpComponentHandleRule extends MongooseModelBase implements IMongooseModelBase {
    buildMongooseModel(): any;
    static get toObjectOptions(): {
        transform(doc: any, ret: any, options: any): {
            ruleId: any;
        } & Pick<any, string | number | symbol>;
    };
}
