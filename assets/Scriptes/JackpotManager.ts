import { _decorator, Component, Node, sp, Vec3, Label, Color } from 'cc';
import { Tween, tween } from 'cc';
import { NumberManager } from './NumberManager';
import { CurrencyRun } from './CurrencyRun';
const { ccclass, property } = _decorator;

@ccclass('JackpotManager')
export class JackpotManager extends Component {
    @property(sp.Skeleton)
    jackpotSke: sp.Skeleton;

    @property(Node)
    jpMask: Node;
    @property(NumberManager)
    numberManager: NumberManager;
    @property(CurrencyRun)
    currencyRun: CurrencyRun;
    @property(Label)
    msg_label: Label;

    // debug
    @property(Label)
    versionLabel: Label;
    @property(Label)
    timerLabel: Label;

    curColor: eColor = eColor.Blue;

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

    labelPosY_GameWin = -71;
    labelPosY_Idle = 1;
    scale_GameWin = 0.9;
    isRollingNumber = false;
    screenType = eDisplay_screen.Bottom;

    msgSchedule = null;

    clickDebugTimes = 0;
    isDebugMode = false;
    isDebugTimer = false;
    debugTimer = 0;

    protected onLoad(): void {
        // window.demoTest = new Object();
        // window.demoTest.InputJackpot = this.InputJackpot.bind(this);

        // @ts-ignore
        window.api = new Object();
        //上螢幕
        // @ts-ignore
        window.api.initJackpot = this.ShowJackpotIdle.bind(this);
        // @ts-ignore
        window.api.hitJackpot = this.showJackpotTopWin.bind(this);
        // @ts-ignore
        window.api.otherWinJackpot = this.showOtherJackpotWin.bind(this);
        // @ts-ignore
        window.api.updateJackpotAmount = this.updateJackpot.bind(this);
        //下螢幕
        // @ts-ignore
        window.api.showGameJackpot = this.showJackpotWin.bind(this);
        // @ts-ignore
        window.api.stopGameJackpot = this.stopJackpot.bind(this);

        // @ts-ignore
        window.api.changeColor = this.changeThemeColor.bind(this);
        window.api.resetAmount = this.resetJackpotAmount.bind(this);

        let self = this;
        //postmessage
        window.addEventListener('message', function (e) {
            let _data = e.data;
            // {event: 'updateJackpotAmount', amount: 100.0}
            if (_data.event) {
                console.log("---cocos---", _data);
                switch (_data.event) {
                    case "initJackpot":
                        self.ShowJackpotIdle(_data.amount);
                        break;
                    case "hitJackpot":
                        self.showJackpotTopWin(_data.amount, _data.msg);
                        break;
                    case "otherWinJackpot":
                        self.showOtherJackpotWin(_data.amount, _data.msg);
                        break;
                    case "updateJackpotAmount":
                        self.updateJackpot(_data.amount);
                        break;
                    case "showGameJackpot":
                        self.showJackpotWin(_data.amount, _data.successCallback, _data.errorCallback);
                        break;
                    case "changeColor":
                        self.changeThemeColor(_data.color);
                        break;
                    default:
                        console.error("postmessage 找不到該事件,", _data.event);
                        break;
                }
            }
        });

        let _v = "Ver. 2K.0.0.1";
        console.log("jp_p ", _v);
        this.versionLabel.string = _v;
    }
    start() {
        // this.Jp_label_Node.active = false;
        // this.jackpotSke.node.active = false;
        // this.ShowJackpotWin(1004680.78);
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

    changeThemeColor(color: string) {
        const lowercasedColor: string = color.toLowerCase();
        console.log("change color: ", lowercasedColor); // 輸出: "red"

        let selectedColor: eColor;
        switch (lowercasedColor) {
            case "red":
                selectedColor = eColor.Red;
                break;
            case "yellow":
                selectedColor = eColor.Yellow;
                break;
            case "green":
                selectedColor = eColor.Green;
                break;
            case "blue":
                selectedColor = eColor.Blue;
                break;
            case "purple":
                selectedColor = eColor.Purple;
                break;
            default:
                console.error(`未知的顏色：${lowercasedColor}`);
                selectedColor = eColor.Red;
                return;
        }

        console.log(`更改顏色：${selectedColor}`);
        this.jackpotSke.clearTracks();
        this.jackpotSke.skeletonData = null;
    }

    //#region Game Win
    public showJackpotWin(num: number, jackpotCompleteCallback = null, errorCallback = null) {
        if (num == null) {
            console.error("win number is null");
            num = 0;
        }

        if (this.runJPschedule) {
            this.unschedule(this.runJPschedule);
            this.runJPschedule = null;
        }
        console.log("[ShowJackpotWin], ", num);
        this.jackpotSke.node.active = true;
        this.jpMask.active = false;
        this.jackpotCompleteCallback = jackpotCompleteCallback;
        this.jackpotSke.setAnimation(0, eJackpotState.InGameWinStart, false);

        // this.timerStart();
        this.targetNum = num;
        this.SetJackpotText(0);
        this.runJPschedule = this.scheduleOnce(() => {
            this.jpMask.active = true;
            let _pos = new Vec3(this.jpMask.position.x, this.labelPosY_GameWin, this.jpMask.position.z);
            this.jpMask.setPosition(_pos);
            this.jpMask.setScale(new Vec3(this.scale_GameWin, this.scale_GameWin, 1));
            this.SetJackpotText(this.targetNum);    // start run jackpot
        }, 2.3667);

        let self_jpske = this.jackpotSke;
        this.jackpotSke.setCompleteListener(() => {
            this.JackpotComplete();
            self_jpske.setCompleteListener(null)
        });

    }

    public JackpotComplete() {
        this.jackpotSke.node.active = false;
        this.jpMask.active = false;
        if (this.jackpotCompleteCallback)
            this.jackpotCompleteCallback();
        else
            console.warn("Not find JackpotComplete callback");

        this.unscheduleAllCallbacks();
    }

    public stopJackpot() {
        this.jackpotSke.setCompleteListener(null);
        this.JackpotComplete();
    }
    //#endregion

    //#region Top Game Idel
    ShowJackpotIdle(num: number) {
        console.log("[ShowJackpotIdle], ", num);
        if (num == null) { num = 0 }
        this.jackpotSke.node.active = true;
        this.jpMask.active = true;
        let _pos = new Vec3(this.jpMask.position.x, this.labelPosY_Idle, this.jpMask.position.z);
        this.jpMask.setPosition(_pos);
        this.jpMask.setScale(Vec3.ONE);
        this.jackpotSke.setAnimation(0, eJackpotState.TopIdle, true);
        this.targetNum = num;
        this.SetJackpotText(num);
    }

    resetJackpotAmount(num: number) {
        this.numberManager.clearNumber(num);
        this.currencyRun.clearNumber();
    }

    showJackpotTopWin(num: number, msg: string) {
        if (num == null) { console.error("win number is null"); num = 0; }
        this.jackpotSke.node.active = true;
        this.numberManager.initNumber(num);
        this.jackpotSke.setAnimation(0, eJackpotState.TopWin, false);
        let self = this;
        this.jackpotSke.setCompleteListener(() => {
            console.log("[showJackpotTopWin] complete!");
            self.jackpotSke.setCompleteListener(null);
            self.ShowJackpotIdle(self.origNum);
        });

        if (this.msgSchedule)
            this.unschedule(this.msgSchedule)
        this.msgSchedule = this.scheduleOnce(() => { self.hideMsg(msg) }, 27.3);
        this.showMsg(msg);
    }

    showOtherJackpotWin(num: number, msg: string) {
        this.jackpotSke.node.active = true;
        this.numberManager.initNumber(num);
        this.jackpotSke.setAnimation(0, eJackpotState.TopOtherWin, false);
        let self = this;
        this.jackpotSke.setCompleteListener(() => {
            console.log("[showOtherJackpotWin] complete!");
            self.jackpotSke.setCompleteListener(null);
            self.ShowJackpotIdle(self.origNum);
        });

        if (this.msgSchedule)
            this.unschedule(this.msgSchedule)
        this.msgSchedule = this.scheduleOnce(() => { self.hideMsg(msg) }, 27.3);
        this.showMsg(msg);
    }

    updateJackpot(num: number) {
        this.nowNum = this.targetNum;
        this.targetNum = num;
        this.numberManager.updateNumber(num);
    }

    showMsg(msg: string) {
        // 987654321**** win the magin Jackpot
        this.msg_label.string = msg;
        this.msg_label.node.active = true;
        let _c = new Color(this.msg_label.color);
        tween(_c)
            .set({ r: _c.r, g: _c.g, b: _c.b, a: 0 })
            .to(0.5, { r: _c.r, g: _c.g, b: _c.b, a: 255 }, { onUpdate: v => { this.msg_label.color = _c; } })
            .start();
    }

    hideMsg(msg: string) {
        // 987654321**** win the magin Jackpot
        this.msg_label.string = msg;
        let _c = new Color(this.msg_label.color);
        tween(_c)
            .set({ r: _c.r, g: _c.g, b: _c.b, a: _c.a })
            .to(0.5, { r: _c.r, g: _c.g, b: _c.b, a: 0 }, { onUpdate: v => { this.msg_label.color = _c; } })
            .call(() => { this.msg_label.node.active = false })
            .start();
    }
    //#endregion

    //#region  tools
    formatNumber(num: number): string {
        // 将数字转换为字符串，并且固定为两位小数
        const numStr = num.toFixed(2);
        // 使用正则表达式将整数部分加入逗号分隔
        const parts = numStr.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }
    SetJackpotText(num: number) {
        this.numberManager.initNumber(num)
        // this.Jp_label.string = `<size=238>${params[0]}</size><size=171>.${params[1]}</size>`;
    }
    timerStart() {
        this.timerLabel.string = "0.00";
        this.debugTimer = 0;
        this.isDebugTimer = true;
    }
    timerStop() {
        this.isDebugTimer = false;
    }
    clickDebug() {
        this.clickDebugTimes++;
        if (this.clickDebugTimes >= 10) {
            this.clickDebugTimes = 0;
            this.isDebugMode = !this.isDebugMode;
            this.versionLabel.node.active = this.isDebugMode;
        }
    }

    //#endregion
}

enum eJackpotState {
    InGameWinLoop = "InGame_PlayerWin_Loop",
    InGameWinStart = "InGame_PlayerWin_Start",
    TopIdle = "Top_Idle1",
    TopOtherWin = "Top_Win",
    TopWin = "Top_Win_Player",
}

enum eDisplay_screen {
    Top = "top",
    Middle = "middle",
    Bottom = "bottom"
}

enum eColor {
    Red = 0,
    Yellow,
    Green,
    Blue,
    Purple
}
