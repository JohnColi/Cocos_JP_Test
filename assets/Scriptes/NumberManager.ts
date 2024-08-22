import { _decorator, Component, Node, Prefab, RichText, SpriteFrame, isValid, instantiate, Sprite } from 'cc';
import { DigitRun } from './DigitRun';
const { ccclass, property } = _decorator;

@ccclass('NumberManager')
export class NumberManager extends Component {
    @property(Node) php_node: Node;
    @property(Prefab) dig_pfb: Prefab;
    @property([DigitRun]) digits: DigitRun[] = [];

    @property([SpriteFrame])
    number_spf: SpriteFrame[] = [];
    /**貨幣的圖片Node */
    @property(Node) currency: Node;

    curNumber: number = 0;
    tarNumber: number = 0;
    //scale 0.72;  //w 64, 符號的寬度
    state: eState = eState.Idle;
    isDebugMode = true;

    start() {
        this.digits = this.node.getComponentsInChildren(DigitRun);
        if (this.isDebugMode) {
            // @ts-ignore
            window.jo = new Object();
            // @ts-ignore
            window.jo.initNumber = this.initNumber.bind(this);
            window.jo.updateNumber = this.updateNumber.bind(this);
            // window.jo.runNumber = this.sequentiallyChangeDigits.bind(this);

            this.scheduleOnce(() => { this.initNumber(100) }, 0.1)
        }
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
        else if (digCount > _s.length) {
            let difference = digCount - _s.length;
            for (let i = 0; i < difference; i++) {
                this.digits[i].node.active = false;
            }
        }
        // else {
        //     for (let i = 0; i < this.digits.length; i++) {
        //         this.digits[i].node.active = true;
        //     }
        // }

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
                    this.digits[dig_i].initDotComma(_s[i]);
                }
                dig_i--;
            }
        });
    }

    creatorDigit() {
        let obj = instantiate(this.dig_pfb);
        this.node.insertChild(obj, 1);  // 0是幣值
        obj.name = "dig_" + (this.digits.length - 3);
        console.log("creat digit name", obj.name);
        let _digitRun = obj.getComponent(DigitRun);
        this.digits.unshift(_digitRun);
    }

    updateNumber(target: number) {
        if (target < this.curNumber) {
            console.warn("Target:", target, "< cur:", this.curNumber);
            this.initNumber(target);
            return;
        }

        let _str = target.toFixed(2);
        this.tarNumber = Number.parseFloat(_str);
        console.log("Update Number, target:", this.tarNumber, "  state:", this.state);

        if (this.state == eState.Runnig) {
            console.warn("jackpot is Running!!");
            return;
        }

        let dif_n = this.tarNumber - this.curNumber;

        // //進位邏輯
        // let dif_s = dif_n.toFixed(0);
        // this.state = eState.Runnig;

        // //check dig   5.00  1,000.00
        // this.digits[0].runNumber

        if (dif_n < 1) {
        }
        else {
        }
        this.sequentiallyChangeDigits(_str);
    }

    curRun_i = 0;
    curTargetArr: string[] = [];
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

    digitCarry() {
        this.curRun_i++;
        let s_i = this.curTargetArr.length - 1 - this.curRun_i;
        let _n = Number.parseInt(this.curTargetArr[s_i]);
        if (s_i < 0) {
            this.curRun_i = 0;
            console.log("進位結束")
            return;
        }

        let d_i = this.digits.length - 1 - this.curRun_i;
        let needCreator = false;
        if (!this.digits[d_i]) {
            this.creatorDigit();
            d_i = 0;
            needCreator = true;
        }

        console.log("[digitCarry], i:", s_i, "  n:", _n);
        if (isNaN(_n)) {
            if (needCreator) {
                if (this.curTargetArr[s_i])
                    this.digits[d_i].creatDotComma(",", this.digitCarry());
                else
                    console.error("strArr[s_i] is error,", this.curTargetArr[s_i]);
            }
            else
                this.digitCarry();
        }
        else {
            if (needCreator) {
                if (this.curTargetArr[s_i])
                    this.digits[d_i].creatNumber(_n, this.digitCarry());
                else
                    console.error("strArr[s_i] is error,", this.curTargetArr[s_i]);
            }
            else
                this.digits[d_i].toTargetNumber(_n, this.digitCarry.bind(this));
        }
    }

    addNumber(addNumber: number) {
        this.updateNumber(this.curNumber + addNumber);
    }
}

export enum eNumber {
    Dot = 10,
    Comma = 11
}

enum eState {
    Idle,
    Runnig,
}