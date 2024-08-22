import { _decorator, Component, Node, sp } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ChangeSke')
export class ChangeSke extends Component {
    @property(sp.Skeleton)
    sk: sp.Skeleton;

    start() {
        if (!this.sk) {
            this.sk = this.getComponent(sp.Skeleton);
        }
    }

    change() {

    }

    update(deltaTime: number) {

    }
}


