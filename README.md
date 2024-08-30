| Event              | Param      | Type           | Description                    |
| -------------------| ---------- | ---------------| ------------------------------|
| changeColor        | color      | `string`     | 更換主題色的顏色, 全部小寫,ex:`blue`, `red` |
| hitJackpot         | amount       | `number`    | 當前玩家中獎, 獎金顯示`amount` |
|                               | msg       | `string`    | 當前玩家中獎, 彈窗訊息`msg` |
| ohterWinJackpot    | amount       | `number`    | 其他玩家中獎, 獎金顯示`amount` |
|                               | msg       | `string`    | 其他玩家中獎, 彈窗訊息`msg` |
| initJackpot        | amount       | `number`    | 設定獎金池金額`amount`  |
| updateJackpotAmount | amount      | `number`    | 更新獎金池金額到`amount` |
|遊戲的畫面呈現的 Jackpot|
| showGameJackpot      | num      | `number`    | 遊戲中顯示Jackpot,金額到`num` |
|                      | successCallback|`function` | Jackpot 結束後的callback, 可為`null` |
|                      | errorCallback|`function` | Jackpot 出錯的callback , 可為`null`|
| stopGameJackpot |  none     |     | 強制停止遊戲中的Jackpot |
