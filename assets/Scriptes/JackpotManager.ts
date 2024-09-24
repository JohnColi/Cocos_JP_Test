import { _decorator, Button, Color, Component, instantiate, Node, Prefab, sp, Vec3, Label, resources, find, editorExtrasTag, view, Size } from 'cc';
import { assetManager, AudioSource, tween, math } from 'cc';
import { ResolutionPolicy, screen } from 'cc';
import { JackpotBanner } from './JackpotBanner';
import { NumberManager } from './NumberManager';
import { EDITOR, PREVIEW } from 'cc/env';
const { ccclass, property } = _decorator;

@ccclass('JackpotManager')
export class JackpotManager extends Component {
    @property(sp.Skeleton)
    jackpotSke: sp.Skeleton;

    @property(Node)
    JackpotPool: Node;
    /**number mask */ jpMask: Node;
    numberManager: NumberManager;
    jackpotBanner: JackpotBanner;
    @property(Label)
    msg_label: Label;

    @property(Button)
    close_btn: Button;
    bgm: AudioSource;

    numberNode: Node[] = [null, null];

    JP_run; //save ttimer
    /**要到達的金額 */
    targetNum: number = 0;
    curNum: number = 0;
    origNum: number = 1000;
    jackpotCompleteCallback = null;
    /**中獎表演開啟 */ runJPschedule = null;

    labelPosY_GameWin: number[] = [-48, -71]; // -48/-71  
    labelPosY_Idle = 1;  // 
    scale_GameWin = 0.9;
    scale_hybrid = 0.8;

    isRollingNumber = false;
    displayModel = eDisplayModel.Normal;
    themeColor = eColor.Red;
    resolution = eResolution._2K;
    currency: string = '';
    localization = "en_us";
    is4K = false;
    isHaveAmount = false;
    isHitJackpot = false;
    /**假的自己跑分數 */ isDemoMode = false;
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

    /**初始化用 */ progressCount = 0;
    isLoadingFinished = false;

    /**需要 */ needtoShowInGameJackpot = false;

    //3840 x 2160
    //3840 x 1690
    //2560 x 1440

    msgLabelDataMap = new Map<string, { y: number, scale: number }>();
    thin_numberData = { x: 420, y: 78, scale: 1 }

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
        // @ts-ignore
        window.api.setCurrency = this.setCurrency.bind(this);
        // @ts-ignore
        window.api.setLanguage = this.setLanguage.bind(this);

        window.api.addAmount = this.addAmount.bind(this);
        window.api.setResolution = this.resolutionTest.bind(this);
        window.api.setScreen = this.setScreenTest.bind(this);
        window.api.test = this.testLoading.bind(this);

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
                        self.showJackpotTopWin(_data.amount, _data.msg, _data.type, _data.successCallback);
                        break;
                    case "otherWinJackpot":
                        self.showOtherJackpotWin(_data.amount, _data.msg, _data.successCallback);
                        break;
                    case "updateJackpotAmount":
                        self.updateJackpot(_data.amount);
                        break;
                    case "showGameJackpot":
                        self.showJackpotWin(_data.amount, _data.successCallback, _data.errorCallback); //
                        break;
                    case "changeColor":
                        self.changeThemeColor(_data.color);
                        break;
                    case "setCurrency":
                        self.setCurrency(_data.currency);
                        break;
                    default:
                        console.error("postmessage 找不到該事件,", _data.event);
                        break;
                }
            }
        });

        //ftp://ftp.calda.win/lax/7001/clients/0.0.2?theme_color=Green&display_model=normal&resolution=4K&amount=30000

        let _v = "Ver. 0.0.10";
        console.log("jp_p ", _v);
        this.versionLabel.string = _v;

        this.msgLabelDataMap.set(eDisplayModel.Normal + eResolution._2K, { y: -228, scale: 1 });
        this.msgLabelDataMap.set(eDisplayModel.Normal + eResolution._4K, { y: -336, scale: 1.5 });
        this.msgLabelDataMap.set(eDisplayModel.Hybrid + eResolution._2K, { y: -262, scale: 1.16 });
        this.msgLabelDataMap.set(eDisplayModel.Hybrid + eResolution._4K, { y: -262, scale: 1.16 });
        // let thin_numberData=  {x:420, y: 78, scale: 1 }
    }

    start() {
        this.bgm = this.getComponent(AudioSource);
        if (EDITOR || this.isDebugMode) {
            this.displayModel = eDisplayModel.Normal;
            this.resolution = eResolution._2K;
            this.themeColor = eColor.Red;
            // @ts-ignore 要防呆
            if (this.displayModel == eDisplayModel.Hybrid || (this.displayModel == eDisplayModel.Normal && this.resolution == eResolution._4K)) {
                this.resolution = eResolution._4K;
                this.is4K = true;
            } else {
                this.resolution = eResolution._2K;
                this.is4K = false;
            }

            // this.isHitJackpot = true;

            this.isHaveAmount = true;
            this.curNum = 5000;

            this.changeBundle();
            this.setResolution();
            this.setNumberManager();
        } else {
            this.getUrlParams();
        }

        // this.scheduleOnce(() => {
        //     if (this.isHaveAmount) {
        //         this.showJackpotIdle(this.curNum);
        //     }
        // }, 0.2);
    }

    protected update(dt: number): void {
        // if (this.isDebugTimer) {
        //     this.debugTimer += dt;
        //     this.timerLabel.string = this.debugTimer.toFixed(2);
        // }
        if (!this.isLoadingFinished && this.progressCount >= 2) {
            this.isLoadingFinished = true;
            this.jpMask.active = this.displayModel == eDisplayModel.Thin; //暫時解

            if (this.needtoShowInGameJackpot) {
                // console.log(">>> 開始表演");
                this.showJackpotWin(this.targetNum, this.jackpotCompleteCallback)
                return;
            }

            if (this.isHitJackpot) {
                this.showJackpotIdle(2000);
            }
            else {
                if (this.displayModel != eDisplayModel.Game /* && this.isHaveAmount*/) {
                    this.showJackpotIdle(this.curNum);
                }

                if (this.isDemoMode)
                    this.demoUpdateAmount();
            }
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
                    else if (keyValuePair[0] === "resolution") {
                        let v = keyValuePair[1].toLowerCase();
                        if (v == "4k")
                            this.resolution = eResolution._4K;
                        else
                            this.resolution = eResolution._2K;
                    } else if (keyValuePair[0] === "amount") {
                        let v = Number.parseFloat(keyValuePair[1]);
                        if (v) {
                            console.log("有初始金額:", keyValuePair[1]);
                            this.isHaveAmount = true;
                            this.curNum = v;
                        }
                    } else if (keyValuePair[0] === "currency") {
                        this.currency = keyValuePair[1].toLowerCase();
                    } else if (keyValuePair[0] === "hitJackpot") {
                        if (keyValuePair[1]) {
                            this.isHitJackpot = true;
                        }
                    }
                    else if (keyValuePair[0] === "demoMode") {
                        if (keyValuePair[1]) {
                            console.warn("展示模式")
                            this.isDemoMode = true;
                        }
                    }
                }
            }
        }

        // 要防呆
        if (this.displayModel == eDisplayModel.Hybrid || (this.displayModel == eDisplayModel.Normal && this.resolution == eResolution._4K)) {
            this.resolution = eResolution._4K;
            this.is4K = true;
        } else {
            this.resolution = eResolution._2K;
            this.is4K = false;
        }

        this.changeBundle();
        this.setResolution();
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

    setCurrency(cur: string) {
        this.currency = cur;
        this.numberManager.setCurrency(cur);
    }
    setLanguage(lang) {
        if (lang && lang != "") {
            this.localization = lang;
        }
        else {
            console.warn("not find language!!");
            this.localization = "en_us"
        }
    }

    setTheme(theme: string) {
        let v = theme.toLowerCase();
        switch (v) {
            case "normal":
                this.displayModel = eDisplayModel.Normal;
                break;
            case "thin":
                this.displayModel = eDisplayModel.Thin;
                break;
            case "hybrid":
                this.displayModel = eDisplayModel.Hybrid;
                break;
            case "game":
                this.displayModel = eDisplayModel.Game;
                break;
            default:
                console.error(`Unknown display model: ${v}`);
                this.displayModel = eDisplayModel.Normal;
                break;
        }
    }

    changeBundle() {
        let url = this.themeColor.toString();
        switch (this.displayModel) {
            case eDisplayModel.Normal:
            case eDisplayModel.Game:
                let _r = this.resolution == eResolution._2K ? "" : "4K";
                url = url + _r;
                break;
            case eDisplayModel.Thin:
                url = url + "B"
                break;
            case eDisplayModel.Hybrid:  //目前只有4K
                url = url + "4KH";
                break;
        }

        if (EDITOR || this.isDebugMode) {
            url = url;
            // if (this.displayModel != eDisplayModel.Normal)
            //      view.setDesignResolutionSize(3810, 2160, ResolutionPolicy.FIXED_HEIGHT);
        } else {
            const domainUrl = "https://prd10-icontent.calda.win/lax/7001/assets/0.0.2/"
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
                bundle.load(`Jackpot`, Prefab, function (err2, prefab) {
                    if (err2) {
                        console.error("prefab is error,", err2);
                    } else {
                        let obj = instantiate(prefab);
                        self.JackpotPool.insertChild(obj, 1);

                        if (self.displayModel == eDisplayModel.Thin) {
                            self.jackpotBanner = obj.getComponent(JackpotBanner);
                        }
                        else {
                            self.jackpotSke = obj.getComponent(sp.Skeleton);
                        }
                        self.progressCount++;
                    }
                });
            }
        });
    }

    setResolution() {
        let w = 0; let h = 0;
        if (this.displayModel == eDisplayModel.Thin) { w = 3840; h = 481; }
        else if (this.displayModel == eDisplayModel.Hybrid) {
            w = 3840; h = 1690;
        }
        else { //eDisplayModel.Normal
            if (this.resolution == eResolution._2K) { w = 2560; h = 1440; }
            else { w = 3840; h = 2160; }
        }
        view.setDesignResolutionSize(w, h, ResolutionPolicy.SHOW_ALL);
        console.log("model:", this.displayModel, " _", this.resolution, " , size:", view.getDesignResolutionSize());
        screen.windowSize = new Size(w, h);
    }

    resolutionTest(w: number, h: number, index) {
        switch (index) {
            case 0:
                view.setDesignResolutionSize(w, h, ResolutionPolicy.EXACT_FIT);
                break;
            case 1:
                view.setDesignResolutionSize(w, h, ResolutionPolicy.SHOW_ALL);
                break;
            case 2:
                view.setDesignResolutionSize(w, h, ResolutionPolicy.NO_BORDER);
                break;
            case 3:
                view.setDesignResolutionSize(w, h, ResolutionPolicy.FIXED_HEIGHT);
                break;
            case 4:
                view.setDesignResolutionSize(w, h, ResolutionPolicy.FIXED_WIDTH);
                break;
            default:
                console.error("沒有此分辨率");
                return
        }
        console.log("model:", this.displayModel, " _", this.resolution, " , size:", view.getDesignResolutionSize());
    }

    setScreenTest(w: number, h: number) {
        screen.windowSize = new Size(w, h);
    }

    setNumberManager() {
        let i_manage = this.displayModel == eDisplayModel.Normal ? 0 : 1;
        /** prefab Url*/
        let url = "Prefab/NumberMask";
        // 先防呆處理
        if (this.displayModel == eDisplayModel.Hybrid || (this.resolution == eResolution._4K && this.displayModel == eDisplayModel.Normal)) {
            url += "_4K";
        }

        let needScale = this.displayModel == eDisplayModel.Hybrid;
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
                self.numberManager.setCurrency(self.currency);
                if (needScale) {
                    obj.setScale(new Vec3(this.scale_hybrid, this.scale_hybrid, 1));
                }
                if (self.displayModel == eDisplayModel.Thin) {
                    obj.setPosition(new Vec3(self.thin_numberData.x, self.thin_numberData.y, 1));
                }
                self.scheduleOnce(() => {
                    self.jpMask.active = false;
                    self.progressCount++;
                })
            });
        }
    }

    //#region Game Win
    /**inGame Jackpot */
    public showJackpotWin(num: number, jackpotCompleteCallback: Function = null, errorCallback: Function = null) {
        if (this.displayModel == eDisplayModel.Thin) {
            console.error("displayModel:Thin , can't play in Game Jackpot!")
            return;
        }
        if (num == null) {
            console.error("win number is null");
            num = 0;
        }

        this.targetNum = num;
        this.jackpotCompleteCallback = jackpotCompleteCallback;

        if (!this.isLoadingFinished) {
            this.needtoShowInGameJackpot = true;
            console.warn("[showJackpotWin] jackpot loading....");
            return;
        }

        if (this.runJPschedule) {
            this.unschedule(this.runJPschedule);
            this.runJPschedule = null;
        }
        console.log("[ShowJackpotWin], ", num);
        this.bgm.play();
        this.jackpotSke.node.active = true;
        this.jpMask.active = false;
        this.jackpotSke.setAnimation(0, eJackpotState.InGameWinStart, false);

        // this.timerStart();

        let _i = this.resolution == eResolution._2K ? 0 : 1;
        let gameWinPosY = this.labelPosY_GameWin[_i];

        console.log(" ------ ", gameWinPosY);
        // this.SetJackpotText(0);
        this.runJPschedule = this.scheduleOnce(() => {
            this.jpMask.active = true;
            let _pos = new Vec3(this.jpMask.position.x, gameWinPosY, this.jpMask.position.z);
            this.jpMask.setPosition(_pos);
            this.jpMask.setScale(new Vec3(this.scale_GameWin, this.scale_GameWin, 1));
            this.SetJackpotText(this.targetNum);    // start run jackpot
        }, 2.3667);

        let self = this;
        this.jackpotSke.setCompleteListener(() => {
            self.jackpotSke.setCompleteListener(null)
            console.log("[ShowJackpotWin] jackpot complete");
            // 預留秀彈窗 處理
            self.jackpotSke.setAnimation(0, eJackpotState.InGameWinLoop, true);
            self.close_btn.node.active = true;
            this.scheduleOnce(() => { self.JackpotComplete() }, 5);
        });
    }
    public JackpotComplete() {
        console.log("[JackpotComplete]");
        this.jackpotSke.node.active = false;
        this.jpMask.active = false;
        if (this.jackpotCompleteCallback) {
            this.jackpotCompleteCallback();
        }
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
        if (num == null) { num = 0, console.error("number is null!"); }
        this.jpMask.active = true;

        if (this.displayModel == eDisplayModel.Thin) {
            // Banner 不重設pos
        } else {
            if (this.displayModel == eDisplayModel.Hybrid)
                this.jpMask.setScale(new Vec3(this.scale_hybrid, this.scale_hybrid, 1));

            let _pos = new Vec3(this.jpMask.position.x, this.labelPosY_Idle, this.jpMask.position.z);
            this.jpMask.setPosition(_pos);
            this.jackpotSke.node.active = true;
            this.jackpotSke.setAnimation(0, eJackpotState.TopIdle, true);
        }

        this.targetNum = num;
        // 是否已經有digits
        let b = this.numberManager.checkDigitsEnough(num);
        if (b)
            this.numberManager.clearNumber(num);
        else
            this.numberManager.initNumber(num)
    }

    showJackpotTopWin(num: number, msg: string, type = "top", successCallback: Function = null) {
        if (num == null) { console.error("win number is null"); num = 0; }
        if (type == "inGame") {
            this.showJackpotWin(num, successCallback);
            return;
        }
        this.numberManager.initNumber(num);
        let hideMsg: Function;

        if (this.displayModel == eDisplayModel.Thin) {
            let self = this;
            this.jackpotBanner.showMsg(msg);
            hideMsg = () => { self.jackpotBanner.hideMsg() };
        } else {
            this.jackpotSke.node.active = true;
            this.jackpotSke.setAnimation(0, eJackpotState.TopWin, false);
            let self = this;
            this.jackpotSke.setCompleteListener(() => {
                console.log("[showJackpotTopWin] complete!");
                self.jackpotSke.setCompleteListener(null);
                if (successCallback)
                    successCallback();
                else
                    console.warn("Not find Success Callback!!");
                self.showJackpotIdle(self.origNum);
            });
            hideMsg = () => { self.hideMsg(msg) };
            this.showMsg(msg);
        }

        if (this.msgSchedule)
            this.unschedule(this.msgSchedule)
        this.msgSchedule = this.scheduleOnce(hideMsg, 27.3);
    }

    showOtherJackpotWin(num: number, msg: string, successCallback = null) {
        this.numberManager.initNumber(num);
        let hideMsg: Function;

        if (this.displayModel == eDisplayModel.Thin) {
            let self = this;
            this.jackpotBanner.showMsg(msg);
            hideMsg = () => { self.jackpotBanner.hideMsg() };
        } else {
            this.jackpotSke.node.active = true;
            this.jackpotSke.setAnimation(0, eJackpotState.TopOtherWin, false);
            let self = this;
            this.jackpotSke.setCompleteListener(() => {
                console.log("[showOtherJackpotWin] complete!");
                self.jackpotSke.setCompleteListener(null);
                if (successCallback)
                    successCallback();
                else
                    console.warn("Not find Success Callback!!");
                self.showJackpotIdle(self.origNum);
            });

            hideMsg = () => { self.hideMsg(msg) };
            this.showMsg(msg);
        }

        if (this.msgSchedule)
            this.unschedule(this.msgSchedule)
        this.msgSchedule = this.scheduleOnce(hideMsg, 27.3);
    }

    updateJackpot(num: number) {
        this.curNum = this.targetNum;
        this.targetNum = num;
        this.numberManager.updateNumber(num);
    }

    showMsg(msg: string) {
        const msgData = this.msgLabelDataMap.get(this.displayModel + this.resolution);
        let pos = new Vec3(this.msg_label.node.position);
        pos.y = msgData.y;
        this.msg_label.node.setPosition(pos);
        this.msg_label.node.setScale(new Vec3(msgData.scale, msgData.scale, 1));

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

    addAmount(amount: number) {
        this.targetNum = this.curNum + amount;
        this.updateJackpot(this.targetNum);
        this.curNum = this.targetNum;
    }
    //#endregion

    //#region  debug
    testGamwWin() {
        this.showJackpotTopWin(234567.43, "You won the jackpot!", "inGame", () => {
            console.log("Show Jackpot Complete");
        })
    }
    testLoading() {
        this.progressCount++;
    }
    demoUpdateAmount() {
        let self = this;
        let add: Function = function () {
            let r = math.randomRange(15, 186)
            self.numberManager.addNumber(r);
        }
        this.schedule(add, 20, Number.MAX_VALUE, 5);
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
enum eResolution {
    _2K = "2k",
    _4K = "4k"
}
enum eDisplayModel {
    Normal = "",
    Thin = "B",
    Hybrid = "H",
    Game = "Game",
}

enum eColor {
    Red = "Red",
    Yellow = "Yellow",
    Green = "Green",
    Blue = "Blue",
    Purple = "Purple"
}
