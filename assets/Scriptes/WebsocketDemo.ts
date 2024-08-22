import { _decorator, Component, JsonAsset, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('WebsocketDemo')
export class WebsocketDemo extends Component {

    @property(JsonAsset)
    freeSpinJSON: JsonAsset = null;
    _ws: WebSocket;
    jsonData = null;
    _index = 0;
    start() {
    }

    Connect() {
        this._ws = new WebSocket("ws://localhost:8080");
        this._ws.onerror = this.onError.bind(this);
        this._ws.onopen = this.onOpen.bind(this);
        this._ws.onmessage = this.onMessage.bind(this);
        this._ws.onclose = this.onClose.bind(this);
    }

    onError(data) {
        console.error("onError:", data);
    }
    onOpen(data) {
        console.log("onOpen:", data);
    }
    onMessage(data) {
        // console.log("onMessage:", data);
        console.log("onMessage", data.data);
    }
    onClose(data) {
        console.log("onClose:", data);
    }

    click_connect() {
        this.Connect();
    }

    click_testSend() {
        this._ws.send("Hello World~~")
    }

    click_SendFreeSpin() {
        this.jsonData = this.freeSpinJSON.json!;
        let str = JSON.stringify(this.jsonData[this._index]);
        console.log("send:", str);
        this._ws.send(str);
        this._index++;
        this._index = this._index >= this.jsonData.length ? 0 : this._index;
    }

    click_disconnect() {

    }

}


