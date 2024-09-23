Ver. 0.0.8

## 顯示Second Screen Jackpot

這是Jackpot 的Url

https://prd10-icontent.calda.win/lax/7001/clients/0.0.3/

可以據下方URL 顯示想要的Jackpot

## URL

https://prd10-icontent.calda.win/lax/7001/clients/0.0.3/?display_model=thin&theme_color=yellow&resolution=4k&amount=520078

此 URL 是一個配置請求，根據參數的不同，可以獲得不同的展示效果。

| Name      | Param           | Description                    |
| ---------- | ---------------| ------------------------------|
| display_model       | `Normal`    | 顯示滿版的second screen JP |
|        | `Thin`    | 顯示JP banner. |
|        | `Hybrid`    | 顯示下方留有三方iFrame的second screen JP  |
| resolution       | `2k`    | 顯示2K的畫質 |
|        | `4k`    | 顯示4K的畫質, 如果當前沒有4K素材,會顯示回2K |
| theme_color       | `red` `yellow` `blue` `green` `purple`    | 要顯示的主題顏色 |
| amount       | `string`    | 要顯示的金額`amount` |

## API
ex: `api.hitjackpot(2000, "9955*** win emagine Jackpot, "top", success())`

此 API 是一個配置請求，根據參數的不同，可以獲得不同的展示效果。
| Event              | Param      | Type           | Description                    |
| -------------------| ---------- | ---------------| ------------------------------|
| hitJackpot         | amount       | `number`    | 當前玩家中獎, 獎金顯示`amount` |
|                    | msg       | `string`    | 當前玩家中獎, 彈窗訊息`msg` |
|                    | type       | `string`    | 遊戲畫面的JP`inGame`,上螢幕的JP`top`|
|                    | successCallback| `function`    | Jackpot 結束後的callback|
| ohterWinJackpot    | amount       | `number`    | 其他玩家中獎, 獎金顯示`amount` |
|                    | msg       | `string`    | 其他玩家中獎, 彈窗訊息`msg` |
|                    | successCallback| `function`    | Jackpot 結束後的callback, 可為`null`|
| updateJackpotAmount | amount      | `number`    | 更新獎金池金額到`amount` |
| initJackpot        | amount       | `number`    | 設定獎金池金額`amount`  |
| changeColor        | color      | `string`     | 更換主題色的顏色, 全部小寫,ex:`blue`, `red` |


##  範例 
### 打開Jackpot
打開 綠色的4K emagine Jackpot

https://prd10-icontent.calda.win/lax/7001/clients/0.0.3/?display_model=Normal&theme_color=green&resolution=4k

此時畫面會白的, 打開瀏覽器的主控台, 參照API輸入

`api.initJackpot(200000000)`

就會顯示200,000,000的金額.

### 顯示遊戲中Jackpot 動畫

開啟紅色 Jackpot normal

https://prd10-icontent.calda.win/lax/7001/clients/0.0.3/?display_model=Normal&theme_color=red&resolution=4k

此時畫面會白的, 打開瀏覽器的主控台, 參照API輸入

`api.hitJackpot(123456.56, "ABCD123**** win the emagin Jackpot", "inGame", ()=>{console.log("Jackpot complete");})`


### 顯示Jackpot Banner
開啟黃色 Jackpot Banner 並顯示200000

https://prd10-icontent.calda.win/lax/7001/clients/0.0.3/?display_model=Thin&theme_color=yellow&resolution=2k&amount=200000

打開瀏覽器的主控台, 參照API輸入下

`api.hitJackpot(123456.56, "ABCD123**** win the emagin Jackpot", "top", ()=>{console.log("Jackpot complete");})`

會顯示玩家中獎


## API 需求
## API
ex: `api.hitjackpot(2000, "9955*** win emagine Jackpot, "top", success())`

此 API 是一個配置請求，根據參數的不同，可以獲得不同的展示效果。
| Event              | Param        | Type           | Description                    |
| -------------------| ------------ | ---------------| ------------------------------|
| hitJackpot         | amount       | `number`    | 當前玩家中獎, 獎金顯示`amount` |
|                    | msg          | `string`    | 當前玩家中獎, 彈窗訊息`msg` |
|                    | resetAmount  | `number`    | 結束表演後要顯示的獎金`amount` |
|                    | type         | `string`    | 遊戲畫面的JP`inGame`,上螢幕的JP`top`|
|                    | successCallback| `function`    | Jackpot 結束後的callback|
| ohterWinJackpot    | amount       | `number`    | 其他玩家中獎, 獎金顯示`amount` |
|                    | msg       | `string`    | 其他玩家中獎, 彈窗訊息`msg` |
|                    | successCallback| `function`    | Jackpot 結束後的callback, 可為`null`|
| updateJackpotAmount | amount      | `number`    | 更新獎金池金額到`amount` |
| initJackpot        | amount       | `number`    | 設定獎金池金額`amount`  |
| changeColor        | color      | `string`     | 更換主題色的顏色, 全部小寫,ex:`blue`, `red` |