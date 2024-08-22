import { _decorator, Component, Node, Sprite, UITransform, Vec2, Vec3 } from 'cc';
import { NumberManager, eNumber } from './NumberManager';
import { tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DigitRun')
export class DigitRun extends Component {

    digits: { node: Node, sp: Sprite, pos_i: number, cur_n }[] = [];
    curent_n = 0;
    target_n = 0
    manager: NumberManager;
    /** 符號用的寬度*/w = 64;
    h = 238;
    runState = eRunState.Idle;
    /**中間的圖片index */ index = 1;
    speed_slow = 100;
    speed_fast = 2000;
    speed_next = 2000; //1000
    speed_creator = 2000; //1000

    /**已換圖的次數 */ runnedTimes = 0;
    needRunTimes = 0;
    isDebugMode = false;
    completeCall: Function = null;

    start() {
        this.Init();

        if (this.isDebugMode) {
            window.digitTest = new Object();
            window.digitTest.nextNumber = this.nextNumber.bind(this);
            window.digitTest.initNumber = this.initNumber.bind(this);
            window.digitTest.toTargetNumber = this.toTargetNumber.bind(this);

            window.digitTest.functionTest = this.functionTest.bind(this);
        }
    }

    protected update(dt: number): void {

        if (this.runState == eRunState.Slow) {
            this.moveFunction(this.speed_slow, dt);
        }
        else if (this.runState == eRunState.Next) {
            this.moveFunction(this.speed_next, dt, this.needRunTimes);
        }
        else if (this.runState == eRunState.Fast) {
            this.moveFunction(this.speed_fast, dt);
        }
        else if (this.runState == eRunState.Creator) {
            this.moveFunction(this.speed_creator, dt, 1);
        }
    }

    private Init() {
        if (this.digits.length <= 0) {
            this.manager = this.node.parent.getComponent(NumberManager);
            let childer = this.node.children;
            for (let i = 0; i < childer.length; i++) {
                let _n = childer[i];
                let _s = _n.getComponent(Sprite);
                let pos_i = i;
                let cur_n = (2 + 9) % 10;
                this.digits.push({ node: _n, sp: _s, pos_i: pos_i, cur_n: cur_n });
            }
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

    moveFunction(_speed: number, dt: number, _times: number = 0) {
        let needMove_i = -1;
        for (let i = 0; i < this.digits.length; i++) {
            let pos = new Vec3(this.digits[i].node.position);
            pos.y += dt * _speed;
            this.digits[i].node.position = pos;

            if (pos.y > this.h) {
                needMove_i = i;
            }
        }

        if (needMove_i > -1) {
            if (this.runnedTimes >= _times) {
                console.log("執行結束:", this.curent_n, "  index:", this.index);
                for (let i = 0; i < this.digits.length; i++) {
                    let i_arr = this.newIndices();
                    let _d = this.digits[i_arr[i]].node
                    // console.log("dig:", _d.name);
                    let pos = new Vec3(_d.position);
                    pos.y = this.h * (-1 + i);
                    _d.position = pos;
                }
                this.runState = eRunState.Idle;
                if (this.completeCall)
                    this.completeCall();
                return;
            }

            let next_i = (needMove_i + 2) % 3
            // console.log("needMove_i:", needMove_i, ", next_i:", next_i);
            let digit = this.digits[needMove_i];
            let pos = new Vec3(digit.node.position);
            pos.y = this.digits[next_i].node.position.y - this.h;
            digit.node.position = pos;
            digit.sp.spriteFrame = this.manager.number_spf[(this.curent_n + 2) % 10];

            // 剛開始轉就會換圖 第一次要跳過
            this.runnedTimes++;
            this.curent_n++;
            this.curent_n = this.curent_n > 9 ? this.curent_n % 10 : this.curent_n;
            this.index = (this.index + 1) % 3;
            // console.log("number:", this.curent_n, " runTimes:", this.runnedTimes, " index:", this.index);
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
                    pos.y = this.h * (-1 + i);
                    _d.position = pos;
                }
            }
        }
    }
    /**
     * 
     * @param str 符號 "," "."
     * @param index 要改哪一個位置
     */
    initDotComma(str: string, index = 1) {
        this.node.getComponent(UITransform).width = this.w;
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

    creatNumber(num: number, callback = null) {
        this.Init();
        this.target_n = num;
        this.curent_n = 0;
        this.digits[0].sp.spriteFrame = null;
        this.digits[1].sp.spriteFrame = null;
        this.digits[2].sp.spriteFrame = this.manager.number_spf[1];
        this.toTargetNumber(num, callback);
    }

    creatDotComma(str: string, callback = null) {
        this.Init();
        this.initDotComma(str, 2);
        this.runState = eRunState.Creator;
        if (callback)
            this.completeCall = callback;
    }

    runNumber(target: number) {
        this.target_n = target;
        //fast
    }

    slowRunNumber() {
        console.log("[slowRunNumber]");
        this.runnedTimes = 0;
        this.runState = eRunState.Slow;
    }

    nextNumber() {
        this.target_n = this.curent_n + 1;
        this.needRunTimes = 1;
        this.runnedTimes = 0;
        console.log("[nextNumber], cur:", this.curent_n, " target:", this.target_n);
        this.runState = eRunState.Next;
    }
    toTargetNumber(target: number, callback: Function = null) {
        if (isNaN(target)) {
            console.error("target is NaN!");
            return;
        }

        this.target_n = target;
        this.needRunTimes = this.target_n - this.curent_n;
        this.needRunTimes = this.needRunTimes < 0 ? this.needRunTimes + 10 : this.needRunTimes;
        this.runnedTimes = 0;
        console.log("[nextNumber], cur:", this.curent_n, " target:", this.target_n);
        this.runState = eRunState.Next;

        if (callback)
            this.completeCall = callback;
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
}

enum eRunState {
    Idle,
    Start,
    Fast,
    Slow,
    Stoping,
    End,
    Next,
    Creator, //創建表演
}
