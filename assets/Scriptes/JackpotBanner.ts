import { _decorator, Component, Label, Node, Vec3, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('JackpotBanner')
export class JackpotBanner extends Component {
    @property(Node)
    msgFrame_n: Node;
    @property(Label)
    msg: Label;
    isShowBanner: boolean = false;
    animTimer = 28;

    start() {
        window.banner = new Object();
        window.banner.show = this.showMsg.bind(this);
        window.banner.hide = this.hideMsg.bind(this);
    }
    showMsg(msg: string) {
        if (this.isShowBanner) {
            console.log("正在顯示上一個Jackpot 訊息");
            return;
        }

        this.isShowBanner = true;
        this.msgFrame_n.active = true;
        this.msg.string = msg;
        tween(this.msgFrame_n)
            .set({ scale: new Vec3(0, 0, 0) })
            .to(0.3, { scale: new Vec3(1, 1, 1) })
            .call(() => {
                this.scheduleOnce(() => {
                    this.hideMsg();
                }, this.animTimer);
            })
            .start();
    }

    hideMsg() {
        this.isShowBanner = false;
        tween(this.msgFrame_n)
            .to(0.3, { scale: new Vec3(0, 0, 0) })
            .call(() => {
                this.msg.string = "";
                this.msgFrame_n.active = false;
            }).start();
    }
}


