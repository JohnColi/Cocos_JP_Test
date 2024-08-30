| URL                           | Param      | Type           | Description                    |
| ------------------------------| ---------- | ---------------| ------------------------------|
| window.api.ShowJackpotIdle    | num        | `number`     | 上螢幕Jackpot Idle的初始金額`num` |
| window.api.hitJackpot         | None       |              | 上螢幕其他玩家中獎 |
| window.api.updateJackpotAmount| num        | `number`     | 上螢幕Jackpot 更新獎金池到`num` |
| window.api.ShowJackpotWin     | num        | `number`     | 下螢幕中Jackpot 顯示金額`num`  |
|                               | callback   | `function`   | 成功後要執行的funcion  |
|                               | callback   | `function`   | 失敗後後要執行的funcion, 可以為`null`  |    
| window.api.StopJackpotWin     | None       |              | 強制中止下螢幕jackpot 表演 |
