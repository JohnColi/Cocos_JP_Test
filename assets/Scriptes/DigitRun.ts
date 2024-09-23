import { _decorator, CCBoolean, Component, Node, Sprite, UITransform, Vec2, Vec3, Enum } from 'cc';
import { NumberManager, eNumber } from './NumberManager';
const { ccclass, property } = _decorator;

enum eResolution {
    _2K,
    _4K
}

@ccclass('DigitRun')
export class DigitRun extends Component {
    @property({ step: 1 }) id: number = 0;
    @property({ type: Enum(eResolution) })
    /**原始的scale, 小數點以下是0.75 */ @property({ step: 1 }) scale = 1;
    @property(CCBoolean) isAfterDecimal = false;
    resolution: eResolution = eResolution._2K;

    digits: { node: Node, sp: Sprite }[] = [];
    curent_n = 0;
    target_n = 0
    manager: NumberManager;
    /** 符號用的寬度*/ w_dot = 64;  // 64/96
    size = { w: 136, h: 238 } // 204/136, 357/238
    /** 依據2K,4K調整速率參數*/ rate = 1;
    runState = eRunState.Idle;
    /**中間的圖片index */ index = 1;
    isCarryMode = false;

    speed_running = 2000;
    speed_fast = 2000;
    speed_next = 1000; //1000
    speed_creator = 2000; //1000
    speed_clear = 1500;

    /**已換圖的次數 */ runnedTimes = 0;
    needRunTimes = 0;

    isDebugMode = false;
    completeCallback: Function = null;
    carryCallback: Function = null;
    checkCallback: Function;

    start() {
        this.Init();

        if (this.isDebugMode) {
            // @ts-ignore
            window.digitTest = new Object();
            // @ts-ignore
            window.digitTest.nextNumber = this.nextNumber.bind(this);
            // @ts-ignore
            window.digitTest.initNumber = this.initNumber.bind(this);
            // @ts-ignore
            window.digitTest.toTargetNumber = this.toTargetNumber.bind(this);
            // @ts-ignore
            window.digitTest.fastRunNumber = this.fastRunNumber.bind(this);
            // @ts-ignore
            window.digitTest.slowRunNumber = this.slowRunNumber.bind(this);
            // @ts-ignore
            window.digitTest.functionTest = this.functionTest.bind(this);

            for (let i = 0; i < this.digits.length; i++) {
                this.digits[i].node.children[0].active = true;
            }
        }
    }

    protected update(dt: number): void {
        if (this.runState == eRunState.Fast) {
            this.moveFunction(this.speed_fast, dt, this.needRunTimes);
        }
        else if (this.runState == eRunState.Next) {
            this.moveFunction(this.speed_next, dt, this.needRunTimes);
        }
        else if (this.runState == eRunState.Creator) {
            this.moveFunction(this.speed_creator, dt, 1);
        }
        else if (this.runState == eRunState.Clear) {
            this.moveFunction(this.speed_clear, dt, 1);
        } else if (this.runState == eRunState.Running) {
            this.moveFunction(this.speed_running, dt, this.needRunTimes);
        }
    }

    private Init() {
        if (this.digits.length <= 0) {
            this.manager = this.node.parent.getComponent(NumberManager);
            let childer = this.node.children;
            for (let i = 0; i < childer.length; i++) {
                let _n = childer[i];
                let _s = _n.getComponent(Sprite);
                // let pos_i = i;
                // let cur_n = (2 + 9) % 10;
                this.digits.push({ node: _n, sp: _s });
            }
        }
    }

    setRectData(data: { h, w, w_dot, rate }) {
        this.size = { w: data.w, h: data.h };
        this.w_dot = data.w_dot;
        this.rate = data.rate;
        this.resolution = data.h >= 350 ? eResolution._4K : eResolution._2K;
    }

    /**
     * 
     * @param num 目標數字
     */
    reset2Number(num: number = 0) {
        console.log(">>>> reset2Number:", num);
        this.curent_n = (num + 9) % 10;
        this.digits[0].sp.spriteFrame = null;
        this.digits[1].sp.spriteFrame = null;
        this.digits[2].sp.spriteFrame = this.manager.number_spf[num];
        this.resetDigPos();
    }

    resetDigPos() {
        this.index = 1
        for (let i = 0; i < this.digits.length; i++) {
            let _d = this.digits[i].node
            let pos = new Vec3(_d.position);
            pos.y = this.size.h * (1 - i);
            _d.position = pos;
        }
    }

    functionTest(curent_n) {
        let _s = "";
        for (let i = 0; i < 3; i++) {
            let newIndex = 2 - (curent_n + i + 1) % 3;
            _s = _s + newIndex + ","
        }
        console.log(_s);
    }

    moveFunction(_speed: number, dt: number, _times: number = Number.MAX_VALUE) {
        let needMove_i = -1;
        for (let i = 0; i < this.digits.length; i++) {
            let pos = new Vec3(this.digits[i].node.position);
            pos.y += dt * _speed * this.rate;
            this.digits[i].node.position = pos;

            if (pos.y > this.size.h) {
                needMove_i = i;
            }
        }

        if (needMove_i > -1) {
            if (this.runnedTimes >= _times) {
                // console.log("執行結束:", this.curent_n, "  index:", this.index);
                this.stopRunning();
                this.runnedTimes = 0;
                if (this.completeCallback) {
                    this.completeCallback();
                    this.completeCallback = null;
                }
                return;
            }

            let next_i = (needMove_i + 2) % 3
            // console.log("needMove_i:", needMove_i, ", next_i:", next_i);
            let digit = this.digits[needMove_i];
            let pos = new Vec3(digit.node.position);
            pos.y = this.digits[next_i].node.position.y - this.size.h;
            digit.node.position = pos;
            digit.sp.spriteFrame = this.manager.number_spf[(this.curent_n + 2) % 10];

            // 剛開始轉就會換圖 第一次要跳過
            this.runnedTimes++;
            this.curent_n++;


            if (this.isCarryMode && this.curent_n >= 10) {
                if (this.carryCallback) {
                    // console.log(this.node.name, " 進位");
                    this.carryCallback();
                }
            }

            this.index = (this.index + 1) % 3;
            this.curent_n = this.curent_n > 9 ? this.curent_n % 10 : this.curent_n;
            // console.log("number:", this.curent_n, " runTimes:", this.runnedTimes, " index:", this.index);

            if (this.isCarryMode && this.checkCallback)
                this.checkCallback();
        }
    }
    /**
     * 
     * @param speed 速度
     * @param times 幾次
     */
    startRun(speed: number, times: number) {
        this.speed_running = speed;
        this.needRunTimes = times;
        this.runnedTimes = 0;
        this.runState = eRunState.Running;
    }

    stopRunning() {
        this.runState = eRunState.Idle;
        for (let i = 0; i < this.digits.length; i++) {
            let i_arr = this.newIndices();
            let _d = this.digits[i_arr[i]].node
            // console.log("dig:", _d.name);
            let pos = new Vec3(_d.position);
            pos.y = this.size.h * (-1 + i);
            _d.position = pos;
        }
    }

    initNumber(num: number) {
        console.log(this.node.name, ":", num)
        if (num < 0 || num > 10) {
            this.digits[1].sp.spriteFrame = null;
        } else {
            this.curent_n = num;
            let underNum = (num + 1) % 10;
            let abobeNum = (num + 9) % 10;
            this.digits[0].sp.spriteFrame = this.manager.number_spf[abobeNum];
            this.digits[1].sp.spriteFrame = this.manager.number_spf[num];
            this.digits[2].sp.spriteFrame = this.manager.number_spf[underNum];

            if (this.index != 1) {
                this.index = 1
                for (let i = 0; i < this.digits.length; i++) {
                    let _d = this.digits[i].node
                    let pos = new Vec3(_d.position);
                    pos.y = this.size.h * (1 - i);
                    _d.position = pos;
                }
            }
        }
    }

    clearNumber(callback: Function) {
        let _i = this.newIndices()[0];
        this.digits[_i].sp.spriteFrame = null;
        this.runState = eRunState.Clear;
        this.completeCallback = callback;
    }

    /**
     * @param str 符號 "," "."
     * @param index 要改哪一個位置
     */
    initDotComma(str: string, index = 1) {
        this.node.getComponent(UITransform).width = this.w_dot;
        this.resetDigPos();
        if (str == ',') {
            this.digits[index].sp.spriteFrame = this.manager.number_spf[eNumber.Comma];
            this.curent_n = eNumber.Comma;
            // this.node.name = "dig_comma";
        } else if (str == ".") {
            this.digits[index].sp.spriteFrame = this.manager.number_spf[eNumber.Dot];
            this.curent_n = eNumber.Dot;
            // this.node.name = "dig_dot";
        }
        else
            console.error("錯誤的字串:", str);

        this.digits[(index + 1) % 3].sp.spriteFrame = null;
        this.digits[(index + 2) % 3].sp.spriteFrame = null;
    }

    /**
     * 
     * @param num 目標數字
     * @param callback 
     * @param curent 
     */
    creatNumber(num: number, callback = null, curent: number = 0) {
        this.Init();
        this.target_n = num;
        this.curent_n = curent;
        this.digits[0].sp.spriteFrame = null;
        this.digits[1].sp.spriteFrame = null;
        this.digits[2].sp.spriteFrame = this.manager.number_spf[num];
        this.resetDigPos();
        this.toTargetNumber(num, callback);
    }

    /**
     * 
     * @param str "," "."
     * @param callback 
     * @param speed 
     */
    creatDotComma(str: string, speed: number, callback = null) {
        this.Init();
        if (callback)
            this.completeCallback = callback;

        if (speed == 0) {
            this.runState = eRunState.Creator;
            this.initDotComma(str, 2);
        } else if (speed < 0) {
            this.initDotComma(str, 1);  //直接要在中間
        }
        else {
            this.initDotComma(str, 2);
            this.startRun(speed, 1);
        }
    }

    runNumber(target: number) {
        this.target_n = target;
        //fast
    }

    /**
     * 慢速旋轉
     * @param runTimes 數字+1的次數
     */
    slowRunNumber(runTimes = -1) {
        console.log("[slowRunNumber]");
        this.runnedTimes = 0;
        this.needRunTimes = runTimes < 0 ? Number.MAX_VALUE : runTimes;
        this.runState = eRunState.Slow;
    }
    /**
     * 快速旋轉
     * @param runTimes 數字+1的次數
     */
    fastRunNumber(runTimes = -1, callback = null) {
        let str = runTimes < 0 ? "isLoop" : "need run " + runTimes;
        console.log("[fastRunNumber], ", str);
        this.runnedTimes = 0;
        this.needRunTimes = runTimes < 0 ? Number.MAX_VALUE : runTimes;
        this.runState = eRunState.Fast;

        if (callback)
            this.completeCallback = callback;
    }

    carryRunNumber(callback, checkCallback) {
        this.isCarryMode = true;
        this.carryCallback = callback;
        this.checkCallback = checkCallback;
        this.fastRunNumber();
    }

    nextNumber(callback, speed: number = 2000) {
        this.isCarryMode = true;
        this.target_n = (this.curent_n + 1) % 10;
        this.needRunTimes = 1;
        this.runnedTimes = 0;
        console.log("[nextNumber], cur:", this.curent_n, " target:", this.target_n);
        this.carryCallback = callback;
        this.runState = eRunState.Next;
    }

    carryFinisedRunNumber() {
        console.log(">>> name:", this.node.name)
        this.stopRunning();
        if (this.completeCallback)
            this.completeCallback = null;
        if (this.carryCallback)
            this.carryCallback = null;
    }

    /**
     * 
     * @param target 目標數字
     * @param callback 
     */
    toTargetNumber(target: number, callback: Function = null) {
        if (isNaN(target)) {
            console.error("target is NaN!");
            return;
        }

        this.target_n = target;
        this.needRunTimes = this.target_n - this.curent_n;
        this.needRunTimes = this.needRunTimes < 0 ? this.needRunTimes + 10 : this.needRunTimes;
        this.runnedTimes = 0;
        // console.log("[toTargetNumber], cur:", this.curent_n, " target:", this.target_n);
        this.runState = eRunState.Next;

        if (callback)
            this.completeCallback = callback;
    }

    newIndices(): number[] {
        let newIndices;
        switch (this.index) {
            case 0:
                return newIndices = [1, 0, 2];
            case 1:
                return newIndices = [2, 1, 0];
            case 2:
                return newIndices = [0, 2, 1];
            default:
                console.error("超過2");
                return newIndices = [2, 1, 0];
        }
    }
    /**調整大小 */
    setScale(scale = 1) {
        for (let i = 0; i < this.digits.length; i++) {
            let _node = this.digits[i].node;
            let v = new Vec3(_node.scale.x * scale, _node.scale.y * scale, 1);
            _node.setScale(v);
        }
    }
}

enum eRunState {
    Idle,
    Running,
    Fast,
    Slow,
    Next,
    Creator, //創建表演
    Reset,
    Clear,
}