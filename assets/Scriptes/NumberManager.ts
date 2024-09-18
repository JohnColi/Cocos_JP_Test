import { _decorator, Component, Node, Prefab, RichText, SpriteFrame, isValid, instantiate, CCBoolean } from 'cc';
import { DigitRun } from './DigitRun';
import { CurrencyRun } from './CurrencyRun';
const { ccclass, property } = _decorator;

@ccclass('NumberManager')
export class NumberManager extends Component {
    @property(Node) php_node: Node;
    @property(Prefab) dig_pfb: Prefab;
    digits: DigitRun[] = [];

    @property([SpriteFrame])
    number_spf: SpriteFrame[] = [];
    /**貨幣的圖片 */
    @property(CurrencyRun) currencyRun: CurrencyRun;

    curNumber: number = 0;
    tarNumber: number = 0;
    //scale 0.72;  //w 64, 符號的寬度
    state: eRunState = eRunState.Idle;
    isDebugMode = true;
    /**已經播放到哪一個dig */
    curRun_i = 0;
    /**目標金額字串 */
    curTargetArr: string[] = [];
    /**已經停止到哪一個dig */digStopped_i = 0;
    DigitRunState: eDigitRunState = eDigitRunState.SequentiallyChange;

    @property(CCBoolean)
    is4K = false;

    digitData = [{ h: 238, w: 64, rate: 1 }, { h: 357, w: 96, rate: 1.5 }];
    
    speed_faset = 2000;

    start() {
        this.digits = this.node.getComponentsInChildren(DigitRun);
        let _data = this.is4K ? this.digitData[1] : this.digitData[0];
        for (let i = 0; i < this.digits.length; i++) {
            this.digits[i].setRectData(_data);
        }
        this.currencyRun.setRectData(_data);

        if (this.isDebugMode) {
            // @ts-ignore
            window.jo = new Object();
            // @ts-ignore
            window.jo.initNumber = this.initNumber.bind(this);
            // @ts-ignore
            window.jo.updateNumber = this.updateNumber.bind(this);
            // @ts-ignore
            window.jo.addNumber = this.addNumber.bind(this);
            // @ts-ignore
            window.jo.resetNumber = this.clearNumber.bind(this)

            // this.scheduleOnce(() => { this.initNumber(100) }, 0.1)
        }
    }

    init(is4K: boolean) {
        this.is4K = is4K;
        console.log("is 4K:",this.is4K);
    }

    initNumber(num: number) {
        let _str = num.toFixed(2);
        this.curNumber = Number.parseFloat(_str);
        console.log("InitNumber:", this.curNumber);
        // 使用正则表达式添加千位分隔符
        _str = _str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        let _s = _str.split(``);

        for (let i = 0; i < this.digits.length; i++) {
            this.digits[i].node.active = true;
        }

        let digCount = this.digits.length;
        if (digCount < _s.length) { //自動添加
            let difference = _s.length - digCount;

            for (let i = 0; i < difference; i++) {
                this.creatorDigit()
            }
        }
        else if (digCount >= _s.length) {
            let difference = digCount - _s.length;
            for (let i = 0; i < difference; i++) {
                this.digits[i].reset2Number()
                this.digits[i].node.active = false;
            }
        }

        this.scheduleOnce(() => {
        /**計算位數用*/ let digNumber = -2;
            let dig_i = this.digits.length - 1;
            for (let i = _s.length - 1; i >= 0; i--) {
                let _n = Number.parseFloat(_s[i]);

                if (!isNaN(_n)) {
                    // this.digits[i].node.name = "dig_" + digNumber;
                    this.digits[dig_i].initNumber(_n);
                    digNumber++;
                }
                else {
                    this.digits[dig_i].creatDotComma(_s[i]);
                }
                dig_i--;
            }
        });
    }

    clearedCount = 0;
    needClearCount = 0;
    clearNumber(num: number) {
        this.currencyRun.clearNumber();

        this.needClearCount = 0;
        this.tarNumber = num;
        for (let i = 0; i < this.digits.length; i++) {
            if (this.digits[i].node.active)
                this.needClearCount++;
        }
        let self = this;
        let clearComplete: Function = () => {
            self.clearedCount++;
            // console.log("clear complete , ", self.clearedCount);
            if (self.clearedCount >= self.needClearCount) {
                self.clearedCount = 0;
                // console.log("清理完畢");
                self.initNumber_2();
            }
        };
        for (let i = 0; i < this.digits.length; i++) {
            let digit = this.digits[i];
            if (digit.node.active)
                digit.clearNumber(clearComplete);
        }
    }

    initNumber_2() {
        if (this.tarNumber == null) {
            console.error("Not find target number")
            this.tarNumber = 123.45;
        }
        let _str = this.tarNumber.toFixed(2);
        this.curNumber = Number.parseFloat(_str);
        // console.log("initNumber_2:", this.curNumber);
        // 使用正则表达式添加千位分隔符
        _str = _str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        let _s = _str.split(``);

        for (let i = 0; i < this.digits.length; i++) {
            let dif_n = this.digits.length - _s.length; //4
            let digit = this.digits[i]
            if (i < dif_n) {
                digit.node.active = false;
                continue;
            }
            let s_i = (i - dif_n);
            let _n = Number.parseInt(_s[s_i]);

            if (isNaN(_n)) {
                console.log(_s[s_i]);
                if (_s[s_i] == ",")
                    digit.creatDotComma(",", null, 1000);
                else
                    digit.creatDotComma(".", null, 1000);
            }
            else {
                // console.log(_n);
                digit.creatNumber(_n, null, (_n + 9) % 10);
            }
        }
    }

    creatorDigit() {
        let obj = instantiate(this.dig_pfb);
        this.node.insertChild(obj, 1);  // 0是幣值
        obj.name = "dig_" + (this.digits.length - 3);
        console.log("creat digit name", obj.name);
        let _digitRun = obj.getComponent(DigitRun);
        let _d = this.is4K ? this.digitData[1] : this.digitData[0];
        _digitRun.setRectData(_d);
        this.digits.unshift(_digitRun);
    }

    updateNumber(target: number) {
        if (target < this.curNumber) {
            console.error("Target:", target, "< cur:", this.curNumber);
            this.initNumber(target);
            return;
        }

        let _str = target.toFixed(2);
        this.tarNumber = Number.parseFloat(_str);
        console.log("Update Number, target:", this.tarNumber, "  state:", this.state);

        if (this.state == eRunState.Runnig) {
            console.warn("jackpot is Running!!");
            return;
        }

        let dif_n = this.tarNumber - this.curNumber;

        // //進位邏輯

        switch (this.DigitRunState) {
            case eDigitRunState.SequentiallyStart:
                this.startRun(_str);
                break;
            case eDigitRunState.carryRun:
                this.startCarryRun(_str);
                break;
            case eDigitRunState.SequentiallyChange:
            default:
                //依序更改數字
                this.sequentiallyChangeDigits(_str);
                break;
        }
    }

    startCarryRun(target_s: string) {
        let _s = target_s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        this.curTargetArr = _s.split(``);
        let s_i = this.curTargetArr.length - 1;
        let _n = Number.parseInt(this.curTargetArr[s_i]);
        console.log("curTargetArr:", this.curTargetArr, "  i:", s_i, "  n:", _n);
        let d_i = this.digits.length - 1;
        let self = this;
        this.digits[d_i].carryRunNumber(this.checkDigitCarry.bind(this, 0), () => {
            this.curNumber += 0.01
            if (this.curNumber >= this.tarNumber) {
                console.log("分數到 滾動停止!   n:", this.curNumber);
                self.digits[d_i].carryFinisedRunNumber();
            }
        });
        // this.digits[d_i].carryRunNumber(this.checkDigitCarry.bind(this, 0));
    }

    /**依序開始轉動 */
    startRun(target_s: string) {
        // 目前功能有問題
        let _s = target_s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        this.curTargetArr = _s.split(``);
        for (let i = 0; i < target_s.length; i++) {
            let s_i = this.curTargetArr.length - 1 - i;
            let _n = Number.parseInt(this.curTargetArr[s_i]);
            console.log("curTargetArr:", this.curTargetArr, "  i:", s_i, "  n:", _n);
            let d_i = this.digits.length - 1 - i;
            this.scheduleOnce(() => { this.digits[d_i].fastRunNumber(20); }, i * 0.5);
        }
    }

    /**依序更改位數 */
    sequentiallyChangeDigits(target_s: string) {
        let _s = target_s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        this.curTargetArr = _s.split(``);
        let s_i = this.curTargetArr.length - 1 - this.curRun_i;
        let _n = Number.parseInt(this.curTargetArr[s_i]);
        console.log("curTargetArr:", this.curTargetArr, "  i:", s_i, "  n:", _n);

        let d_i = this.digits.length - 1 - this.curRun_i;
        this.digits[d_i].toTargetNumber(_n, this.digitCarry.bind(this));
    }

    checkDigitCarry(cur_i: number) {
        let next_i = cur_i + 1;
        let d_i = (this.digits.length - 1) - next_i;
        let s_i = (this.curTargetArr.length - 1) - next_i;
        if (s_i < 0) {
            this.curNumber = this.tarNumber;
            console.log("check 進位結束")
            return;
        }

        let needCreator = false; let needOpen = false;
        if (!this.digits[d_i]) {
            this.creatorDigit();
            d_i = 0;
            needCreator = true;
        }
        else if (!this.digits[d_i].node.active) {
            needOpen = true;
        }

        let _n = Number.parseInt(this.curTargetArr[s_i]);
        // console.log("[check Digit Carry], next_i:", next_i, " n:", _n);
        if (isNaN(_n)) {
            if (needCreator || needOpen) {
                if (this.curTargetArr[s_i]) {
                    this.digits[d_i].node.active = true;
                    this.digits[d_i].creatDotComma(",", this.checkDigitCarry.bind(this, next_i));
                }
                else
                    console.error("strArr[s_i] is error,", this.curTargetArr[s_i]);
            }
            else {
                // 已生成 甚麼都不做
                console.log("");
                this.checkDigitCarry(next_i);
            }
        }
        else {
            if (!this.curTargetArr[s_i]) {
                console.error("strArr[s_i] is error,", this.curTargetArr[s_i]);
                return
            }
            if (needCreator) {
                this.digits[d_i].node.active = true;
                this.digits[d_i].creatNumber(1, this.checkDigitCarry.bind(this, next_i));
            }
            else {
                if (needOpen) {
                    this.digits[d_i].node.active = true;
                    this.digits[d_i].nextNumber(this.checkDigitCarry.bind(this, next_i));
                    // this.scheduleOnce(() => { this.digits[d_i].toTargetNumber(_n, this.digitCarry.bind(this)) });
                } else {
                    this.digits[d_i].nextNumber(this.checkDigitCarry.bind(this, next_i));
                }
            }
        }
    }

    /**進位邏輯 */
    digitCarry() {
        this.curRun_i++;
        let s_i = this.curTargetArr.length - 1 - this.curRun_i;
        let _n = Number.parseInt(this.curTargetArr[s_i]);
        if (s_i < 0) {
            this.curRun_i = 0;
            this.curNumber = this.tarNumber;
            console.log("進位結束")
            return;
        }

        let d_i = this.digits.length - 1 - this.curRun_i;
        let needCreator = false; let needOpen = false;
        if (!this.digits[d_i]) {
            this.creatorDigit();
            d_i = 0;
            needCreator = true;
        }
        else if (!this.digits[d_i].node.active) {
            needOpen = true;
        }

        // console.log("[digitCarry], i:", s_i, "  n:", _n);
        if (isNaN(_n)) {
            if (needCreator || needOpen) {
                if (this.curTargetArr[s_i]) {
                    this.digits[d_i].node.active = true;
                    this.digits[d_i].creatDotComma(",", this.digitCarry.bind(this));
                }
                else
                    console.error("strArr[s_i] is error,", this.curTargetArr[s_i]);
            }
            else
                this.digitCarry();
        }
        else {
            if (!this.curTargetArr[s_i]) {
                console.error("strArr[s_i] is error,", this.curTargetArr[s_i]);
                return
            }
            if (needCreator) {
                this.digits[d_i].node.active = true;
                this.digits[d_i].creatNumber(_n, this.digitCarry.bind(this));
            }
            else {
                if (needOpen) {
                    this.digits[d_i].node.active = true;
                    this.digits[d_i].toTargetNumber(_n, this.digitCarry.bind(this));
                    // this.scheduleOnce(() => { this.digits[d_i].toTargetNumber(_n, this.digitCarry.bind(this)) });
                } else
                    this.digits[d_i].toTargetNumber(_n, this.digitCarry.bind(this));
            }
        }
    }

    addNumber(addNumber: number) {
        this.updateNumber(this.curNumber + addNumber);
    }

    /** 檢查digit數量是否大於數字*/
    chececkDigitsEnough(num): boolean {
        let _str = num.toFixed(2);
        this.curNumber = Number.parseFloat(_str);
        console.log("InitNumber:", this.curNumber);
        // 使用正则表达式添加千位分隔符
        _str = _str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        let _s = _str.split(``);

        let digCount = this.digits.length;
        let b = digCount >= _s.length
        return b;
    }
}

export enum eNumber {
    Dot = 10,
    Comma = 11
}

enum eRunState {
    Idle,
    Runnig,
}

enum eDigitRunState {
    SequentiallyChange,
    SequentiallyStart,
    carryRun,   //10進位
}