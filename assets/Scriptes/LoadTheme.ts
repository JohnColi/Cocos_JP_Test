import { _decorator, Component, instantiate, Node, Prefab, sp } from 'cc';
import { assetManager } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoadTheme')
export class LoadTheme extends Component {
    @property(sp.Skeleton)
    JP_ske: sp.Skeleton;

    @property(Node)
    jp_ske_parent: Node;

    start() {
        window.api = new Object()
        window.api.loadGreen = this.Loadbundle.bind(this);
    }

    Loadbundle() {
        let url = "https://prd10-icontent.calda.win/lax/7001/assets/Green";
        console.log("load bundle:", url);
        assetManager.loadBundle(url, (err, bundle) => {
            if (err) {
                console.error(err);
            } else {
                bundle.load(`prefab`, Prefab, function (err, prefab) {
                    if (err) {
                        console.error("prefab is error,", err);
                    } else {
                        let obj = instantiate(prefab);
                        let _ske = obj.getComponent(sp.Skeleton);
                        this.JP_ske = _ske;
                        this.jp_ske_parent.insertChild(obj, 1);
                    }
                });
            }
        });
    }
}