import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CurrencyRun')
export class CurrencyRun extends Component {
    speed_clear = 1500;
    speed_creator = 2000; //1000

    h = 357; // 357/238 = 1.5倍
    /** 依據2K,4K調整速率參數*/ rate = 1.5;
    /**已換圖的次數 */ runnedTimes = 0;
    needRunTimes = 0;
    runState: eRunState = eRunState.Idle;
    completeCallback: Function = null;
    start() {
        window.currency = new Object();
        window.currency.clearNumber = this.clearNumber.bind(this);
    }

    clearNumber() {
        this.runState = eRunState.Clear;
        this.completeCallback = this.resetNumber;
    }
    resetNumber() {
        let pos = new Vec3(this.node.position);
        pos.y = -this.h *2;
        this.node.position = pos;

        this.runState = eRunState.Creator;
        this.completeCallback = this.resetPos;
    }

    resetPos() {
        let pos = new Vec3(this.node.position);
        pos.y = 0;
        this.node.position = pos;
    }

    update(deltaTime: number) {
        if (this.runState == eRunState.Creator) {
            this.moveFunction(this.speed_creator, deltaTime, 0);
        }
        else if (this.runState == eRunState.Clear) {
            this.moveFunction(this.speed_creator, deltaTime, this.h);
        }

    }

    moveFunction(_speed: number, dt: number, targetPos:number) {
        let pos = new Vec3(this.node.position);
        pos.y += dt * _speed * this.rate;
        this.node.position = pos;

        if (pos.y > targetPos) {
            this.runState = eRunState.Idle;
            if (this.completeCallback)
                this.completeCallback();
            else
                console.error("callback is null!");
        }
    }
}

enum eRunState {
    Idle,
    Fast,
    Slow,
    Next,
    Creator, //創建表演
    Reset,
    Clear
}


