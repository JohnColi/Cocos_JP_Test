import { _decorator, Button, Color, Component, instantiate, Node, Prefab, sp, Vec3, Label, resources, find } from 'cc';
import { assetManager, AudioSource, tween } from 'cc';
import { ResolutionPolicy, view } from 'cc';
import { NumberManager } from './NumberManager';
import { EDITOR, PREVIEW } from 'cc/env';
const { ccclass, property } = _decorator;

@ccclass('JackpotManager')
export class JackpotManager extends Component {
    @property(sp.Skeleton)
    jackpotSke: sp.Skeleton;

    @property(Node)
    JackpotPool: Node;
    jpMask: Node;
    numberManager: NumberManager;
    @property(Label)
    msg_label: Label;

    @property(Button)
    close_btn: Button;
    bgm: AudioSource;

    numberNode: Node[] = [null, null];

    JP_run; //save ttimer
    /**要到達的金額 */
    targetNum: number = 0;
    nowNum: number = 0;
    origNum: number = 1000;
    jackpotCompleteCallback = null;
    /**中獎表演開啟 */ runJPschedule = null;

    labelPosY_GameWin = -48; // -48/-71  
    labelPosY_Idle = 1;  // 
    scale_GameWin = 0.9;
    isRollingNumber = false;
    displayModel = eDisplayModel.Normal;
    themeColor = eColor.Red;
    is4K = false;

    msgSchedule = null;

    // debug
    @property(Label)
    versionLabel: Label;
    @property(Label)
    timerLabel: Label;
    clickDebugTimes = 0;
    isDebugMode = false;
    isDebugTimer = false;
    debugTimer = 0;

    //3840 x 2160
    //3840 x 1690
    //2560 x 1440

    protected onLoad(): void {
        // @ts-ignore
        window.api = new Object();
        //上螢幕
        // @ts-ignore
        window.api.initJackpot = this.showJackpotIdle.bind(this);
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

        let self = this;
        //postmessage
        window.addEventListener('message', function (e) {
            let _data = e.data;
            // {event: 'updateJackpotAmount', amount: 100.0}
            if (_data.event) {
                console.log("---cocos---", _data);
                switch (_data.event) {
                    case "initJackpot":
                        self.showJackpotIdle(_data.amount);
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

        let _v = "Ver. 2K.0.0.2";
        console.log("jp_p ", _v);
        this.versionLabel.string = _v;
    }

    start() {
        // console.log("is EDITOR:", EDITOR, "  PREVIEW:", PREVIEW);
        this.bgm = this.getComponent(AudioSource);
        if (EDITOR) {
            this.displayModel = eDisplayModel.Normal_4K;
            this.themeColor = eColor.Green;
            this.changeBundle();
            this.setNumberManager();
        } else {
            this.getUrlParams();
        }

    }

    protected update(dt: number): void {
        if (this.isDebugTimer) {
            this.debugTimer += dt;
            this.timerLabel.string = this.debugTimer.toFixed(2);
        }
    }

    // by url 
    public getUrlParams() {
        var url = window.location.href;
        console.log("location:", window.location);
        let params_all = url.split("?");

        if (params_all.length > 1) {
            let params = params_all[1].split("&");
            for (let i = 0; i < params.length; i++) {
                let param = params[i];
                let keyValuePair = param.split("="); // 分割键和值
                if (keyValuePair.length === 2) {
                    if (keyValuePair[0] === "display_model") {
                        this.setTheme(keyValuePair[1]);
                    } else if (keyValuePair[0] === "theme_color") {
                        this.changeThemeColor(keyValuePair[1]);
                    }
                }
            }
        }

        this.is4K = this.displayModel != eDisplayModel.Normal;
        this.changeBundle();
        this.setNumberManager();
    }

    changeThemeColor(color: string) {
        let lowercasedColor = color.toLowerCase();

        switch (lowercasedColor) {
            case "red":
                this.themeColor = eColor.Red;
                break;
            case "yellow":
                this.themeColor = eColor.Yellow;
                break;
            case "green":
                this.themeColor = eColor.Green;
                break;
            case "blue":
                this.themeColor = eColor.Blue;
                break;
            case "purple":
                this.themeColor = eColor.Purple;
                break;
            default:
                console.error(`未知的顏色：${lowercasedColor}`);
                this.themeColor = eColor.Red;
                return;
        }
    }

    setTheme(theme: string) {
        let v = theme.toLowerCase();
        switch (v) {
            case "normal":
                this.displayModel = eDisplayModel.Normal;
                break;
            case "normal_4k":
                this.displayModel = eDisplayModel.Normal_4K;
                break;
            case "thin":
                this.displayModel = eDisplayModel.Thin;
                break;
            case "hybrid":
                this.displayModel = eDisplayModel.Hybrid;
                break;
            default:
                console.error(`Unknown display model: ${v}`);
                this.displayModel = eDisplayModel.Normal;
                break;
        }
    }

    changeBundle() {
        const domainUrl = "https://prd10-icontent.calda.win/lax/7001/assets/"

        let url = this.themeColor + this.displayModel;
        if (EDITOR || PREVIEW) {
            url = url;
            if (this.displayModel != eDisplayModel.Normal)
                view.setDesignResolutionSize(3810, 2160, ResolutionPolicy.FIXED_HEIGHT);
        } else {
            url = domainUrl + url;
        }

        console.log("bundle URL:", url);
        let self = this;
        if (this.JackpotPool.children.length >= 0)
            this.JackpotPool.removeAllChildren();
        assetManager.loadBundle(url, (err, bundle) => {
            if (err) {
                console.error(err);
            } else {
                bundle.load(`Jackpot`, Prefab, function (err, prefab) {
                    if (err) {
                        console.error("prefab is error,", err);
                    } else {
                        let obj = instantiate(prefab);
                        let _ske = obj.getComponent(sp.Skeleton);
                        self.jackpotSke = _ske;
                        self.JackpotPool.insertChild(obj, 1);
                    }
                });
            }
        });
    }

    setNumberManager() {
        let i_manage = this.displayModel == eDisplayModel.Normal ? 0 : 1;
        let url = this.displayModel == eDisplayModel.Normal ? "Prefab/NumberMask" : "Prefab/NumberMask_4K";
        let self = this;
        if (!this.numberNode[i_manage]) {
            resources.load(url, Prefab, (err, prefab) => {
                if (err) {
                    console.error(err);
                    return;
                }
                const obj = instantiate(prefab);
                find('Canvas').insertChild(obj, 2);
                self.jpMask = obj;
                self.numberManager = obj.children[0].getComponent(NumberManager);
                self.numberManager.init(self.is4K);
            });
        }
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
        this.bgm.play();
        this.jackpotSke.node.active = true;
        this.jpMask.active = false;
        this.jackpotCompleteCallback = jackpotCompleteCallback;
        this.jackpotSke.setAnimation(0, eJackpotState.InGameWinStart, false);

        // this.timerStart();
        this.targetNum = num;
        // this.SetJackpotText(0);
        this.runJPschedule = this.scheduleOnce(() => {
            this.jpMask.active = true;
            let _pos = new Vec3(this.jpMask.position.x, this.labelPosY_GameWin, this.jpMask.position.z);
            this.jpMask.setPosition(_pos);
            this.jpMask.setScale(new Vec3(this.scale_GameWin, this.scale_GameWin, 1));
            this.SetJackpotText(this.targetNum);    // start run jackpot
        }, 2.3667);

        let self_jpske = this.jackpotSke;
        this.jackpotSke.setCompleteListener(() => {
            self_jpske.setCompleteListener(null)
            // 預留秀彈窗 處理
            this.jackpotSke.setAnimation(0, eJackpotState.InGameWinLoop, true);
            this.close_btn.node.active = true;

            this.scheduleOnce(() => { }, 30);
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
    showJackpotIdle(num: number) {
        console.log("[ShowJackpotIdle], ", num);
        if (num == null) { num = 0 }
        this.jackpotSke.node.active = true;
        this.jpMask.active = true;
        let _pos = new Vec3(this.jpMask.position.x, this.labelPosY_Idle, this.jpMask.position.z);
        this.jpMask.setPosition(_pos);
        this.jpMask.setScale(Vec3.ONE);
        this.jackpotSke.setAnimation(0, eJackpotState.TopIdle, true);
        this.targetNum = num;

        // this.SetJackpotText(num);
        let b = this.numberManager.chececkDigitsEnough(num);
        if (b)
            this.numberManager.clearNumber(num);
        else
            this.numberManager.initNumber(num)
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
            self.showJackpotIdle(self.origNum);
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
            self.showJackpotIdle(self.origNum);
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
    onTouch_JackpotClose() {
        this.JackpotComplete();
        this.close_btn.node.active = false;
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

enum eDisplayModel {
    Normal = "",
    Normal_4K = "4K",
    Thin = "Banner",
    Hybrid = "4KH"
}

enum eColor {
    Red = "Red",
    Yellow = "Yellow",
    Green = "Green",
    Blue = "Blue",
    Purple = "Purple"
}
