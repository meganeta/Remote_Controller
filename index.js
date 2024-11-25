const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const { v4: uuidv4 } = require('uuid');

// 储存已连接的用户及其标识
const clients = new Map();

let FMconId = "";
let FMpassword = "zzz123123";

// 存储消息关系
const relations = new Map();

const punishmentDuration = 5; //默认发送时间1秒

const punishmentTime = 1; // 默认一秒发送1次

// 存储客户端和发送计时器关系
const clientTimers = new Map();

// 定义心跳消息
const heartbeatMsg = {
    type: "heartbeat",
    clientId: "",
    targetId: "",
    message: "200"
};

// 定义定时器
let heartbeatInterval;

// Create an HTTP server
const app = express();

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);

const wss = new WebSocket.Server({server});

const PORT = process.env.PORT || 80;
server.listen(PORT, () => {
  console.log('HTTPS Server running on port '+PORT);
});

wss.on('connection', function connection(ws) {
    // 生成唯一的标识符
    const clientId = uuidv4();

    console.log('新的 WebSocket 连接已建立，标识符为:', clientId);

    //存储
    clients.set(clientId, ws);

    // 发送标识符给客户端（格式固定，双方都必须获取才可以进行后续通信：比如浏览器和APP）
    ws.send(JSON.stringify({ type: 'bind', clientId, message: 'targetId', targetId: '' }));

    if (FMconId) {
        ws.send(JSON.stringify({ type: 'FM_con',targetId:FMconId}));
    }

    console.log("QR Code: "+"https://www.dungeon-lab.com/app-download.php#DGLAB-SOCKET#wss://con-meganeta.onrender.com/" + clientId)

    // 监听发信
    ws.on('message', function incoming(message) {
        console.log("收到消息：" + message)
        let data = null;
        try {
            data = JSON.parse(message);
        }
        catch (e) {
            console.log("非JSON数据处理");
            // 非JSON数据处理
            ws.send(JSON.stringify({ type: 'msg', clientId: "", targetId: "", message: '403' }))
            return;
        }

        if (FMconId && data.hasOwnProperty('speed') && data.password) {
            if (data.password == FMpassword) {

                
                try {
                    if (data.speed == -1) {
                        clients.delete(FMconId); //清除ws客户端
                        console.log("已清除炮机" + FMconId + " ,当前size: " + clients.size)
                        FMconId = "";

                        // 遍历 clients Map，更新炮机消息
                        clients.forEach((value, key) => {
                            value.send(JSON.stringify({ type: 'FM_con',targetId:""}));
                        });
                    } else {
                        const client = clients.get(FMconId);
                        client.send(JSON.stringify({ speed: data.speed}));
                    }
                    
                }
                catch (e) {
                    console.log("炮机客户端出错！");
                }
            }
            return;
        }

        // 非法消息来源拒绝
        if (clients.get(data.clientId) !== ws && clients.get(data.targetId) !== ws) {
            console.log("非法消息来源拒绝");
            ws.send(JSON.stringify({ type: 'msg', clientId: "", targetId: "", message: '404' }))
            return;
        }

        if (data.type && data.clientId && data.message && data.targetId) {

            // 优先处理绑定关系
            const { clientId, targetId, message, type } = data;
            switch (data.type) {
                case "FM_CON":
                    FMconId = data.clientId;

                    console.log("收到炮机："+FMconId);

                    // 遍历 clients Map，更新炮机消息

                    clients.forEach((value, key) => {
                        if (key != FMconId) {
                            value.send(JSON.stringify({ type: 'FM_con',targetId:FMconId}));
                        }
                    });
                    break;
                case "bind":
                    // 服务器下发绑定关系
                    if (clients.has(clientId) && clients.has(targetId)) {
                        // relations的双方都不存在这俩id
                        if (![clientId, targetId].some(id => relations.has(id) || [...relations.values()].includes(id))) {
                            relations.set(clientId, targetId);
                            const client = clients.get(clientId);
                            const sendData = { clientId, targetId, message: "200", type: "bind" }
                            ws.send(JSON.stringify(sendData));
                            client.send(JSON.stringify(sendData));
                        }
                        else {
                            const data = { type: "bind", clientId, targetId, message: "400" }
                            ws.send(JSON.stringify(data))
                            return;
                        }
                    } else {
                        const sendData = { clientId, targetId, message: "401", type: "bind" }
                        ws.send(JSON.stringify(sendData));
                        return;
                    }
                    break;
                case 1:
                case 2:
                case 3:
                    // 服务器下发APP强度调节
                    if (relations.get(clientId) !== targetId) {
                        const data = { type: "bind", clientId, targetId, message: "402" }
                        ws.send(JSON.stringify(data))
                        return;
                    }
                    if (clients.has(targetId)) {
                        const client = clients.get(targetId);
                        const sendType = data.type - 1;
                        const sendChannel = data.channel ? data.channel : 1;
                        const sendStrength = data.type >= 3 ? data.strength : 1 //增加模式强度改成1
                        const msg = "strength-" + sendChannel + "+" + sendType + "+" + sendStrength;
                        const sendData = { type: "msg", clientId, targetId, message: msg }
                        client.send(JSON.stringify(sendData));
                    }
                    break;
                case 4:
                    // 服务器下发指定APP强度
                    if (relations.get(clientId) !== targetId) {
                        const data = { type: "bind", clientId, targetId, message: "402" }
                        ws.send(JSON.stringify(data))
                        return;
                    }
                    if (clients.has(targetId)) {
                        const client = clients.get(targetId);
                        const sendData = { type: "msg", clientId, targetId, message }
                        client.send(JSON.stringify(sendData));
                    }
                    break;
                case "clientMsg":
                    // 服务端下发给客户端的消息
                    if (relations.get(clientId) !== targetId) {
                        const data = { type: "bind", clientId, targetId, message: "402" }
                        ws.send(JSON.stringify(data))
                        return;
                    }
                    if (!data.message2) {
                        const data = { type: "error", clientId, targetId, message: "501" }
                        ws.send(JSON.stringify(data))
                        return;
                    }
                    if (clients.has(targetId)) {
                        let sendtimeA = data.time1 ? data.time1 : punishmentDuration; // AB通道的执行时间可以独立
                        let sendtimeB = data.time2 ? data.time2 : punishmentDuration;
                        const target = clients.get(targetId); //发送目标
                        const sendDataA = { type: "msg", clientId, targetId, message: "pulse-" + data.message }
                        const sendDataB = { type: "msg", clientId, targetId, message: "pulse-" + data.message2 }
                        let totalSendsA = punishmentTime * sendtimeA;
                        let totalSendsB = punishmentTime * sendtimeB;
                        const timeSpace = 1000 / punishmentTime;

                        console.log("消息发送中，总消息数A：" + totalSendsA + "总消息数B：" + totalSendsB + "持续时间A：" + sendtimeA + "持续时间B：" + sendtimeB)
                        if (clientTimers.has(clientId)) {
                            // 计时器尚未工作完毕, 清除计时器且发送清除APP队列消息，延迟150ms重新发送新数据
                            // 新消息覆盖旧消息逻辑
                            ws.send("当前有正在发送的消息，覆盖之前的消息")

                            const timerId = clientTimers.get(clientId);
                            clearInterval(timerId); // 清除定时器
                            clientTimers.delete(clientId); // 清除 Map 中的对应项

                            // 发送APP波形队列清除指令
                            const clearDataA = { clientId, targetId, message: "clear-1", type: "msg" }
                            const clearDataB = { clientId, targetId, message: "clear-2", type: "msg" }
                            target.send(JSON.stringify(clearDataA));
                            target.send(JSON.stringify(clearDataB));
                            setTimeout(() => {
                                delaySendMsg(clientId, ws, target, sendDataA, sendDataB, totalSendsA, totalSendsB, timeSpace);
                            }, 150);
                        } else {
                            // 不存在未发完的消息 直接发送
                            delaySendMsg(clientId, ws, target, sendDataA, sendDataB, totalSendsA, totalSendsB, timeSpace);
                        }
                    } else {
                        console.log(`未找到匹配的客户端，clientId: ${clientId}`);
                        const sendData = { clientId, targetId, message: "404", type: "msg" }
                        ws.send(JSON.stringify(sendData));
                    }
                    break;
                default:
                    // 未定义的普通消息
                    if (relations.get(clientId) !== targetId) {
                        const data = { type: "bind", clientId, targetId, message: "402" }
                        ws.send(JSON.stringify(data))
                        return;
                    }
                    if (clients.has(clientId)) {
                        const client = clients.get(clientId);
                        const sendData = { type, clientId, targetId, message }
                        client.send(JSON.stringify(sendData));
                    } else {
                        // 未找到匹配的客户端
                        const sendData = { clientId, targetId, message: "404", type: "msg" }
                        ws.send(JSON.stringify(sendData));
                    }
                    break;
            }
        }
    });

    ws.on('close', function close() {
        // 连接关闭时，清除对应的 clientId 和 WebSocket 实例
        console.log('WebSocket 连接已关闭');
        // 遍历 clients Map，找到并删除对应的 clientId 条目
        let clientId = '';
        clients.forEach((value, key) => {
            if (value === ws) {
                // 拿到断开的客户端id
                clientId = key;
            }
        });
        console.log("断开的client id:" + clientId)
        relations.forEach((value, key) => {
            if (key === clientId) {
                //网页断开 通知app
                let appid = relations.get(key)
                let appClient = clients.get(appid)
                const data = { type: "break", clientId, targetId: appid, message: "209" }
                appClient.send(JSON.stringify(data))
                appClient.close(); // 关闭当前 WebSocket 连接
                relations.delete(key); // 清除关系
                console.log("对方掉线，关闭" + appid);
            }
            else if (value === clientId) {
                // app断开 通知网页
                let webClient = clients.get(key)
                const data = { type: "break", clientId: key, targetId: clientId, message: "209" }
                webClient.send(JSON.stringify(data))
                webClient.close(); // 关闭当前 WebSocket 连接
                relations.delete(key); // 清除关系
                console.log("对方掉线，关闭" + clientId);
            }
        })
        clients.delete(clientId); //清除ws客户端
        console.log("已清除" + clientId + " ,当前size: " + clients.size)

        if(FMconId == clientId) {
            FMconId = "";
        }
    });

    ws.on('error', function (error) {
        // 错误处理
        console.error('WebSocket 异常:', error.message);
        // 在此通知用户异常，通过 WebSocket 发送消息给双方
        let clientId = '';
        // 查找当前 WebSocket 实例对应的 clientId
        for (const [key, value] of clients.entries()) {
            if (value === ws) {
                clientId = key;
                break;
            }
        }
        if (!clientId) {
            console.error('无法找到对应的 clientId');
            return;
        }
        // 构造错误消息
        const errorMessage = 'WebSocket 异常: ' + error.message;

        relations.forEach((value, key) => {
            // 遍历关系 Map，找到并通知没掉线的那一方
            if (key === clientId) {
                // 通知app
                let appid = relations.get(key)
                let appClient = clients.get(appid)
                const data = { type: "error", clientId: clientId, targetId: appid, message: "500" }
                appClient.send(JSON.stringify(data))
            }
            if (value === clientId) {
                // 通知网页
                let webClient = clients.get(key)
                const data = { type: "error", clientId: key, targetId: clientId, message: errorMessage }
                webClient.send(JSON.stringify(data))
            }
        })
    });

    // 启动心跳定时器（如果尚未启动）
    if (!heartbeatInterval) {
        heartbeatInterval = setInterval(() => {
            // 遍历 clients Map（大于0个链接），向每个客户端发送心跳消息
            if (clients.size > 0) {
                console.log(relations.size, clients.size, '发送心跳消息：' + new Date().toLocaleString());
                clients.forEach((client, clientId) => {
                    heartbeatMsg.clientId = clientId;
                    heartbeatMsg.targetId = relations.get(clientId) || '';
                    client.send(JSON.stringify(heartbeatMsg));
                });
            }
        }, 60 * 1000); // 每分钟发送一次心跳消息
    }
});

function delaySendMsg(clientId, client, target, sendDataA, sendDataB, totalSendsA, totalSendsB, timeSpace) {
    // 发信计时器 AB通道会分别发送不同的消息和不同的数量 必须等全部发送完才会取消这个消息 新消息可以覆盖
    console.log("发送消息给郊狼！");
    console.log(sendDataA);

    target.send(JSON.stringify(sendDataA)); //立即发送一次AB通道的消息
    target.send(JSON.stringify(sendDataB));
    totalSendsA--;
    totalSendsB--;
    if (totalSendsA > 0 || totalSendsB > 0) {
        return new Promise((resolve, reject) => {
            // 按频率发送消息给特定的客户端
            const timerId = setInterval(() => {
                if (totalSendsA > 0) {
                    target.send(JSON.stringify(sendDataA));
                    totalSendsA--;
                }
                if (totalSendsB > 0) {
                    target.send(JSON.stringify(sendDataB));
                    totalSendsB--;
                }
                // 如果达到发送次数上限，则停止定时器
                if (totalSendsA <= 0 && totalSendsB <= 0) {
                    clearInterval(timerId);
                    //client.send("发送完毕")
                    clientTimers.delete(clientId); // 删除对应的定时器
                    resolve();
                }
            }, timeSpace); // 每隔频率倒数触发一次定时器

            // 存储clientId与其对应的timerId
            clientTimers.set(clientId, timerId);
        });
    }
}

//FM speed update
let speed_init = true;

var fangdou = 500; //500毫秒防抖
var fangdouSetTimeOut; // 防抖定时器
const waveData = {
    "1": `["0A0A0A0A00000000","0A0A0A0A0A0A0A0A","0A0A0A0A14141414","0A0A0A0A1E1E1E1E","0A0A0A0A28282828","0A0A0A0A32323232","0A0A0A0A3C3C3C3C","0A0A0A0A46464646","0A0A0A0A50505050","0A0A0A0A5A5A5A5A","0A0A0A0A64646464"]`,
    "2": `["0A0A0A0A00000000","0D0D0D0D0F0F0F0F","101010101E1E1E1E","1313131332323232","1616161641414141","1A1A1A1A50505050","1D1D1D1D64646464","202020205A5A5A5A","2323232350505050","262626264B4B4B4B","2A2A2A2A41414141"]`,
    "3": `["4A4A4A4A64646464","4545454564646464","4040404064646464","3B3B3B3B64646464","3636363664646464","3232323264646464","2D2D2D2D64646464","2828282864646464","2323232364646464","1E1E1E1E64646464","1A1A1A1A64646464"]`
}

//TODO COMMENT FROM HERE
function send_machine(val_speed,duration){

    //val_speed = parseInt(val_speed/100*40);
    
    console.log("Send speed: "+val_speed.toString());

    if (FMconId) {
        client = clients.get(FMconId);
        client.send(JSON.stringify({ speed: val_speed}));
    } else {
        console.log("Cyber FM");
    }

    relations.forEach((value, key) => { 
        const clientId = key;
        const targetId = value;

        const client = clients.get(targetId);
        
        //addOrIncrease(3, 1, DGspeed); //A to speed
        const sendType = 2;
        const sendChannel = 1; //only channel A for now
        const sendStrength = parseInt(val_speed/2);
        const msg = "strength-" + sendChannel + "+" + sendType + "+" + sendStrength;
        const sendData = { type: "msg", clientId, targetId, message: msg };

        client.send(JSON.stringify(sendData));

        const sendChannel2 = 2; //only channel B for now
        const msg22 = "strength-" + sendChannel2 + "+" + sendType + "+" + sendStrength;
        const sendData2 = { type: "msg", clientId, targetId, message: msg22 };
        client.send(JSON.stringify(sendData2));

        //addOrIncrease(3, 2, FMspeed); //B to speed
            
        //sendCustomMsg(waveData["1"]);
        if (fangdouSetTimeOut) {
            return;
        }
    
        wave_type = "1";
        const msg1 = `A:${waveData[wave_type]}`;
        const msg2 = `B:${waveData[wave_type]}`;
    
        let sendtimeA = duration; // AB通道的执行时间可以独立
        let sendtimeB = duration;
        const target = clients.get(targetId); //发送目标
        const sendDataA = { type: "msg", clientId, targetId, message: "pulse-" + msg1 }
        const sendDataB = { type: "msg", clientId, targetId, message: "pulse-" + msg2 }
        let totalSendsA = punishmentTime * sendtimeA;
        let totalSendsB = punishmentTime * sendtimeB;
        const timeSpace = 1000 / punishmentTime;
    
        console.log("tgbot郊狼消息发送中，总消息数A：" + totalSendsA + "总消息数B：" + totalSendsB + "持续时间A：" + sendtimeA + "持续时间B：" + sendtimeB)
        if (clientTimers.has(clientId)) {
            
            const timerId = clientTimers.get(clientId);
            clearInterval(timerId); // 清除定时器
            clientTimers.delete(clientId); // 清除 Map 中的对应项
    
            // 发送APP波形队列清除指令
            const clearDataA = { clientId, targetId, message: "clear-1", type: "msg" }
            const clearDataB = { clientId, targetId, message: "clear-2", type: "msg" }
            target.send(JSON.stringify(clearDataA));
            target.send(JSON.stringify(clearDataB));
            setTimeout(() => {
                delaySendMsg(clientId, 1, target, sendDataA, sendDataB, totalSendsA, totalSendsB, timeSpace);
            }, 150);
        } else {
            // 不存在未发完的消息 直接发送
            delaySendMsg(clientId, 1, target, sendDataA, sendDataB, totalSendsA, totalSendsB, timeSpace);
        }
    
        fangdouSetTimeOut = setTimeout(() => {
            clearTimeout(fangdouSetTimeOut);
            fangdouSetTimeOut = null;
        }, fangdou);
    })
}

//telegram bot

const token = '6887731995:AAH6sywApuwSosdxSPhEBsSgaaa5WOvDbFI';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Global variables
let userSelectList = []; // To store user selections
let speed_list = [];
let duration_list = [];
let mode_list = ['轻柔 🥱','挑逗 🥰','常规 😥','激烈 😵‍💫','魔鬼 😈'];
let init_flg = 1;
let new_msg_flg = 0;

//New message refreshing
let message_id;
let chat_id;
let TimeThreshold = 60000*3;

//channel id to forward all messages
let channel_id = '@meganeta_bot';

// Handle /tease_start command
bot.onText(/\/tease_start/, (msg) => {
    //connectWebSocket();

    const chatId = msg.chat.id;

    if(init_flg){
        bot.sendMessage(chatId, '欢迎使用メガネタ（智障版）捏！请按下方按钮来进入炮机/郊狼群控模式！\n Changelog v0.5b\n警告⚠：郊狼已实装，实际强度为bot显示强度的一半！（\n警告⚠：炮机已实装，实际速度为bot显示强度的一半！（\n添加了炮机重连机能。\n添加了选择冷却机制（5秒）。\n添加了防止新消息刷屏的机制（冷却3分钟）。\n优化了界面减小消息占用面积。\n出bug或投喂敲 https://t.me/meganeta', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '请点我',
                            callback_data: 'button_start'
                        }
                    ]
                ]
            }
        });
    }else{
        handleControlMessage(chatId,0);
    }
});

let last_user = "";
let last_user_count = 0;
let last_user_cooldown;
let cd_msg = "";
let cd_msg_saved = "冷却中...";
// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const userFirstName = callbackQuery.from.first_name;
    const data = callbackQuery.data;

    if (userFirstName != last_user) {
        last_user = userFirstName;
        last_user_count = 0;
    } else if (last_user_count == 3) {
        cd_msg = "即将冷却...";
        last_user_cooldown = new Date();
        last_user_count++;
    } else if (last_user_count > 3 && userSelectList.length > 0) {        
        cd_msg = cd_msg_saved;
        cd_msg_saved = cd_msg_saved + ".";
        handleControlMessage(chatId,1);
        cooldown = new Date();
        if (cooldown-last_user_cooldown > 5000) {
            last_user_cooldown = new Date();
            last_user_count = 0;

            cd_msg_saved = "冷却中...";
        }
        return;
    } else {
        last_user_count++;
    }
    
    if(init_flg){
        if(data != 'button_start'){
            bot.sendMessage(chatId,`您好 ${userFirstName} 请使用 /tease_start 开始。\n炮机只能控メガネタ，郊狼请通过 https://con-meganeta.onrender.com 连接。`);
            bot.sendMessage(chatId,`聪明男娘都会点这里： https://t.me/dajibaccta`);
        } else {
            init_flg = 0;
            
            if(FMconId){
                //bot.sendMessage(chatId,`${userFirstName} 开始了捏!`);
            } else {
                bot.sendMessage(chatId,`炮机未连接，可以控郊狼捏~`);
            }
            handleControlMessage(chatId,0);
        }
    }else{
        // if(FMconId){
            switch (data) {
                case 'button_start':
                    if(init_flg == 0){
                        //bot.sendMessage(chatId,`已经开始了哦，请在下方信息选择!`);
                        handleControlMessage(chatId,0);
                    }
                    break;
                case 'mode_1':
                    handlecase(chatId,userFirstName,5,16,5000,15001,0);
                    break;
                case 'mode_2':
                    handlecase(chatId,userFirstName,15,16,5000,15001,1);
                    break;
                case 'mode_3':
                    handlecase(chatId,userFirstName,25,16,5000,15001,2);
                    break;
                case 'mode_4':
                    handlecase(chatId,userFirstName,35,11,5000,15001,3);
                    break;
                case 'mode_5':
                    handlecase(chatId,userFirstName,45,6,5000,15001,4);
                    break;
                default:
                    responseText = `Unknown option selected by ${userFirstName}.`;
                    bot.sendMessage(chatId, responseText);
            }
        // } else {
        //     bot.sendMessage(chatId,`炮机已断开，请使用 /tease_start 重新连接捏~`);
        // }
        
    }
});

function handlecase(chatId,userFirstName,MinVal,MinVal_Var,MinDuration,MinDuration_Var,mode){
    if (userSelectList.length < 1) {
        handleGeneration(userFirstName,MinVal,MinVal_Var,MinDuration,MinDuration_Var,mode,chatId);
        handleControlMessage(chatId,new_msg_flg?0:1);
    } else if (userSelectList.length < 8) {
        handleGeneration(userFirstName,MinVal,MinVal_Var,MinDuration,MinDuration_Var,mode,chatId);
        handleControlMessage(chatId,1);
    }
}

function handleGeneration(userFirstName,MinVal,MinVal_Var,MinDuration,MinDuration_Var,mode,chatId) {
    let val_speed = Math.floor(Math.random()*MinVal_Var) + MinVal;
    let duration = Math.floor(Math.random()*MinDuration_Var) + MinDuration;

    userSelectList.push(`${userFirstName} 选择了`+mode_list[mode]+`，速度 `+val_speed.toString()+ `，时长 `+Math.round(duration/1000).toString()+`秒`);
    speed_list.push(val_speed);
    duration_list.push(duration);
    if(speed_init){
        send_machine(speed_list[0],duration);
        speed_init = false;
    }

    function timeout_exec(chatId){

        userSelectList.shift();
        speed_list.shift();
        duration_list.shift();
        if(speed_list.length>0){
            send_machine(speed_list[0],duration_list[0]);
        } else {
            send_machine(0,0);
        }

        if(duration_list.length>0){
            // Execute a function after a delay of 2 seconds
            setTimeout(timeout_exec,duration_list[0],chatId);
            handleControlMessage(chatId,1);
        } else {
            speed_init = true;
            handleControlMessage(chatId,1);
        }
    }

    if(duration_list.length==1){
        // Execute a function after a delay of 2 seconds
        setTimeout(timeout_exec,duration_list[0],chatId);
    }
}

let currentTime = 0;

function handleControlMessage(chatId,modify) {

    if(currentTime) {
        msgTime = new Date();
        Timepassed = msgTime - currentTime;

        console.log("Time passed: "+Timepassed.toString());

        if (msgTime - currentTime > TimeThreshold){
            if(modify != 2) {
                modify = 0;
                currentTime = new Date();
                /*
                if (!FMconId){
                    socket.close();
                    connectWebSocket();
                }
                */
            }
        }
    }else{
        currentTime = new Date();
    }


    let options = [
                    [
                        {
                            text: mode_list[0], //0-20
                            callback_data: 'mode_1'
                        }
                    ],
                    [
                        {
                            text: mode_list[1], //20-40
                            callback_data: 'mode_2'
                        },
                        
                        {
                            text: mode_list[2], //40-60
                            callback_data: 'mode_3'
                        }
                        
                    ],
                    
                    [
                        {
                            text: mode_list[3], //60-80
                            callback_data: 'mode_4'
                        },
                        
                        {
                            text: mode_list[4], //80-100
                            callback_data: 'mode_5'
                        }
                        
                    ],
                    
                ];

    let concatenatedString = "";
    if (userSelectList.length < 1){
        concatenatedString = "待机中...";
    } else {
        concatenatedString = userSelectList.slice(1).join('\n')+" "+cd_msg;
        cd_msg = "";
        concatenatedString = "正在执行...\n"+userSelectList[0]+"\n\n执行队列：\n"+concatenatedString;
    }

    if (modify){
        bot.editMessageText('当前难度：幼儿园\n当前状态: \n\n'+concatenatedString, {
            chat_id: chat_id,
            message_id: message_id,
            reply_markup: {
                inline_keyboard: options
            }
        /*}).then(() => {
            if (modify == 2) {
                bot.deleteMessage(chat_id, message_id).then(() => {
                    console.log(`Message with ID: ${message_id} deleted.`);
                })
                .catch((error) => {
                    console.error('Error deleting message:', error);
                });
            }*/
        });
        
    }else{        
        bot.sendMessage(chatId, '当前难度：中等\n当前状态: \n\n'+concatenatedString, {
            reply_markup: {
                inline_keyboard: options
            }
        }).then((sentMessage) => {
            chat_id = sentMessage.chat.id;
            message_id = sentMessage.message_id;
        });
    }
    
    
}

console.log('Bot is running...');

// Handle /electrify_start command
bot.onText(/\/electrify_start/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, '欢迎开始发电竞技游戏捏，请参阅下列游戏规则（转载自 @luerjia2077）：');
    
    bot.sendMessage(chatId, '游戏GAME（一）人数随意\n \
    确认好撸的人数后，大家投骰子，确认好射精的先后顺序，然后开始撸，期间大家要互相监督，不能停太久，\
    大家依次射精，如果有人在自己顺序之前射了，就要接受惩罚~消息占用面积 。'
    );

    bot.sendMessage(chatId, '游戏GAME（二）人数随意\n \
    确认好人数后，大家开始撸动，规定视角；视角内必须看到牛牛，在大家的射精下，最后视角必须记录好精液射在了哪里\
    （墙，地板，身上......）不能用手接。最好有一人观察是否全部执行。'
    );

    bot.sendMessage(chatId, '游戏GAME（三）3~6人\n （建议玩过几轮，熟悉玩家后进行）\n \
    开赛前选出一位‘追击员’，其余‘选手’比‘追击员’先开始撸动10秒，随后‘追击员’开始撸动，‘选手’要抢先在‘追击员’之前射精，\
    不然视为失败，失败者要把射出的精液抹回牛牛上，自己龟头责1分钟。'
    );

    bot.sendMessage(chatId, '游戏GAME（四）2~8人上下\n （可由一位管理员发起游戏）\n \
    开始撸动，管理倒计时20分钟，并在15，10，5分钟时设置‘检查点’记录下选手大致的速度，要是超过20分钟，那么没射精的选手会被冠以‘牛牛王’的称号 \
    （除非卫冕，否则一天后删除），超过倒计时可以选择不射精哦~'
    );

    bot.sendMessage(chatId, '游戏GAME（五）3~7人上下\n \
    撸到快射后忍住，寸止一次（热身），正式开始游戏\n （建议多人游玩）\n 由不参与的管理/群友，用随机轮盘之类的方式在热身结束 \
    正式撸动8分钟后开始知名选手,被指到的选手需要1分内射精，没射出来视为失败；要是没有指名的时候射精也视为失败。\
    失败惩罚：游戏结束后，在大家的注视下，用最快速度撸射。'
    );

    bot.sendMessage(chatId, '游戏GAME（六）3~5人上下\n （有些地狱，建议养好身体）\n \
    每人在游戏中必须射精一次，游戏开始后，选手们都有一次‘转嫁权’。\n \
    选择你想转嫁的选手，两人暂时停下撸动，投骰子，或者可以将一次射精转嫁对方，失败反之。\n \
    直到每位选手射完目标为止结束（可能不用射，可能三次？）。（坏笑）\n \
    (拥有最高次数的选手可以获得一次‘平均权’，强制所有人投骰子，当获得中位数以上点数的时候，可以将次数报复给任意先前转嫁次数给自己的选手）。'
    );

    bot.sendMessage(chatId, '游戏GAME（七）2~7人上下\n （撸啊撸啊撸啊）\n \
    这是一场冲刺局，选手在开始前请用大量润滑剂润滑，然后随意撸动，游戏开始后，请快速激烈地射出来吧~\n \
    最后一名今晚寸止一次不准射精~'
    );

    bot.sendMessage(chatId, '游戏GAME（八）1~4人上下\n \
    选手准备好后，请一位不参与的管理/群友，来随机指定一个数字（1~100），数字就是选手要撸动的次数（上下以来回算一次）。\
    选手要在2分钟内撸完指定次数，可以让管理/群友倒计时，结束未完成者，下一回合的数字+10。\
    谁能坚持到最后呢~'
    );

    bot.sendMessage(chatId, '游戏GAME（九）2~8人上下\n （建议所有选手有充足时间再进行）\n \
    休闲局~ 选手可以用任何姿势、速度、手法、道具来辅助自己撸动，选手可以在群里投骰子，进行撸动相关的真心话大冒险，最大的一方决定问题/指令，其余回答。\n\
    大冒险例：寸止一次，拍蛋蛋几次，不允许命令射精相关。\n\
    真心话例：内裤的颜色，上次撸射是什么时候...等（禁政，禁盒，禁冒犯...）\n 可以不射精，纯撸着玩也可以哦~'
    );

    bot.sendMessage(chatId, '游戏GAME（十）3~6人上下\n （来看看运气吧~）\n \
    所有选手撸动150下可以投一枚骰子，只要大于等于5点，就可以计1分，当达到4点时即可获胜，与此同时其余选手需要2分钟内射出来，未完成即败北。\
    需要为肉棒粥贡献本场游戏射精后的牛牛图片。'
    );
});