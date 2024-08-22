import { _decorator, Component, RichText, Node, sp, Vec2, Vec3, Label, setDefaultLogTimes } from 'cc';
import { tween, Tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('JackpotManager')
export class JackpotManager extends Component {
    @property(sp.Skeleton)
    jackpotSke: sp.Skeleton;

    @property(Node)
    Jp_label_Node: Node;
    @property(RichText)
    Jp_label: RichText;

    // debug
    @property(Label)
    versionLabel: Label;
    @property(Label)
    timerLabel: Label;
    isDebugTimer = false;
    debugTimer = 0;

    JP_run; //save ttimer
    totalCount = 100;
    /**要到達的金額 */
    targetNum: number = 0;
    nowNum: number = 0;
    origNum: number = 1000;
    jackpotCompleteCallback = null;
    runJPschedule = null;
    // 2560x1440 原是動畫大小
    // 1920X1080 machine 設定大小

    labelPosY_GameWin = -33;
    labelPosY_Idle = 6;

    isRollingNumber = false;
    screenType = eDisplay_screen.Bottom;


    protected onLoad(): void {
        // window.demoTest = new Object();
        // window.demoTest.InputJackpot = this.InputJackpot.bind(this);

        window.api = new Object();
        //上螢幕
        window.api.ShowJackpotIdle = this.ShowJackpotIdle.bind(this);
        window.api.hitJackpot = this.ShowJackpotTopWin.bind(this);
        window.api.updateJackpotAmount = this.UpdateJackpot.bind(this);
        //下螢幕
        window.api.ShowJackpotWin = this.ShowJackpotWin.bind(this);
        window.api.StopJackpotWin = this.StopJackpot.bind(this);

        let _v = "Ver 0.0.6";
        console.log("jp_p ", _v);
        this.versionLabel.string = _v;
    }
    start() {
        // this.Jp_label_Node.active = false;
        // this.jackpotSke.node.active = false;
        // this.ShowJackpotWin(1004680.78);

        if (this.screenType == eDisplay_screen.Bottom) {

        }
    }

    protected update(dt: number): void {
        if (this.isDebugTimer) {
            this.debugTimer += dt;
            this.timerLabel.string = this.debugTimer.toFixed(2);
        }
    }

    // by url 
    public SetDisplayScreen() {
        var url = window.location.href;
        let params = url.split("?")[1].split("&");

        for (let i = 0; i < params.length; i++) {
            let param = params[i];
            let keyValuePair = param.split("="); // 分割键和值
            if (keyValuePair.length === 2 && keyValuePair[0] === "display_screen") {
                let jackpotValue = keyValuePair[1];

                let parsedValue = parseFloat(jackpotValue);
                if (isNaN(parsedValue)) {
                    console.error("Failed to parse jackpot value:", jackpotValue);
                    return;
                }
                break;
            }
        }
    }

    //#region Game Win
    public ShowJackpotWin(num: number, jackpotCompleteCallback = null, errorCallback = null) {
        if (this.runJPschedule) {
            this.unschedule(this.runJPschedule);
            this.runJPschedule = null;
        }

        console.log("[ShowJackpotWin], ", num);
        this.jackpotSke.node.active = true;
        this.Jp_label_Node.active = false;
        this.jackpotCompleteCallback = jackpotCompleteCallback;
        this.jackpotSke.setAnimation(0, eJackpotState.GameWin, false);

        this.timerStart();
        this.targetNum = num;
        this.SetJackpotText(0);
        this.runJPschedule = this.scheduleOnce(() => {
            this.Jp_label_Node.active = true;
            let _pos = new Vec3(this.Jp_label_Node.position.x, this.labelPosY_GameWin, this.Jp_label_Node.position.z);
            this.Jp_label_Node.setPosition(_pos);
            this.RounJackpot(0, this.targetNum);    // start run jackpot
        }, 2.3667);

        let self_jpske = this.jackpotSke;
        this.jackpotSke.setCompleteListener(() => {
            this.JackpotComplete();
            self_jpske.setCompleteListener(null)
        });

    }

    public JackpotComplete() {
        this.timerStop();
        this.jackpotSke.node.active = false;
        this.Jp_label_Node.active = false;
        if (this.jackpotCompleteCallback)
            this.jackpotCompleteCallback();
        else
            console.warn("Not find JackpotComplete callback");

        this.unscheduleAllCallbacks();
    }

    public StopJackpot() {
        this.jackpotSke.setCompleteListener(null);
        this.JackpotComplete();
    }
    //#endregion

    //#region Top Game Idel
    ShowJackpotIdle(num: number) {
        console.log("[ShowJackpotIdle], ", num);
        if (num == null) { num = 0 }
        this.jackpotSke.node.active = true;
        this.Jp_label_Node.active = true;
        let _pos = new Vec3(this.Jp_label_Node.position.x, this.labelPosY_Idle, this.Jp_label_Node.position.z);
        this.Jp_label_Node.setPosition(_pos);
        this.jackpotSke.setAnimation(0, eJackpotState.TopIdle, true);
        this.targetNum = num;
        this.SetJackpotText(num);
    }

    ShowJackpotTopWin() {
        this.jackpotSke.node.active = true;
        this.Jp_label_Node.active = false;
        this.jackpotSke.setAnimation(0, eJackpotState.TopWin, false);
        this.timerStart();
        let self = this;
        this.jackpotSke.setCompleteListener(() => {
            this.timerStop();
            self.jackpotSke.setCompleteListener(null);
            self.ShowJackpotIdle(self.origNum);
        });
    }

    UpdateJackpot(num: number) {
        this.nowNum = this.targetNum;
        this.targetNum = num;
        this.RounJackpot(this.nowNum, num, 30)
    }
    //#endregion

    //#region  tools
    /**轉動*/
    RounJackpot(startNum: number, targetNum: number, totalCount = 50) {
        if (this.isRollingNumber) {
            console.warn("Number are Rolling");
            return;
        }
        this.isRollingNumber = true;
        let _count = 0;
        let int_i = targetNum / totalCount;
        let now_n = startNum;
        this.SetJackpotText(now_n);
        this.JP_run = setInterval(() => {
            now_n += int_i;
            this.SetJackpotText(now_n);
            _count++;
            if (_count >= totalCount) {
                this.SetJackpotText(targetNum);
                clearInterval(this.JP_run);
                this.isRollingNumber = false;
            }
        }, 50);
    }

    formatNumber(num: number): string {
        // 将数字转换为字符串，并且固定为两位小数
        const numStr = num.toFixed(2);
        // 使用正则表达式将整数部分加入逗号分隔
        const parts = numStr.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }

    SetJackpotText(num: number) {
        let str = this.formatNumber(num);
        let params = str.split(".");
        this.Jp_label.string = `<size=238>${params[0]}</size><size=171>.${params[1]}</size>`;
    }

    timerStart() {
        this.timerLabel.string = "0.00";
        this.debugTimer = 0;
        this.isDebugTimer = true;
    }
    timerStop() {
        this.isDebugTimer = false;
    }
    //#endregion
}

enum eJackpotState {
    TopIdle = "Top_Idle1",
    TopWin = "Top_PlayerWin",
    TopOtherWin = "Top_OtherPlayerWin",
    GameWin = "InGame_PlayerWin"
}

enum eDisplay_screen {
    Top = "top",
    Middle = "middle",
    Bottom = "bottom"
}
