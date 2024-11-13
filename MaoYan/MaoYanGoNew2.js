// 检查无障碍服务是否已经启用
auto.waitFor();
app.launchApp("猫眼");
openConsole();
console.setTitle("猫眼 go!", "#ff11ee00", 30);

// 确认按钮的坐标（不同设备可能需调整）
const ConfirmX = 878;
const ConfirmY = 2263;
var isDebug = false;

// 获取用户输入的多个价位
const ticketPriceInput = rawInput("请输入可接受的多个票价（逗号分隔，例如：800,600,400,200）", "800,600,400,200");
const ticketPrices = ticketPriceInput.split(',').map(price => parseInt(price.trim()));

// 获取抢票开始时间（例如：格式为 "12:00:00"）
var startTimeInput = rawInput("请输入抢票开始时间（格式：HH:mm:ss，例如：12:00:00）");
const [startHour, startMinute, startSecond] = startTimeInput.split(':').map(t => parseInt(t));

// 等待到达抢票开始时间
function waitForStartTime() {
    console.log("等待抢票开始时间 " + startTimeInput + "...");
    while (true) {
        const now = new Date();
        if (now.getHours() >= startHour && now.getMinutes() >= startMinute && now.getSeconds() >= startSecond) {
            console.log("抢票开始！");
            break;
        }
        sleep(100);  // 每秒检查一次时间
    }
}

// 主抢票函数
function main() {
    waitForStartTime();  // 等待到达抢票开始时间

    console.log("开始猫眼抢票!");

    // 检查是否需要点击“立即预订”、“立即购票”或“特惠购票”按钮进入抢票页面
    while (true) {
        console.log("检查是否出现可点击按钮...");
        var but1 = classNameStartsWith('android.widget.').text("立即预订").exists();
        var but2 = classNameStartsWith('android.widget.').text("立即购票").exists();
        var but3 = classNameStartsWith('android.widget.').text("特惠购票").exists();

        if (but1 || but2 || but3) {
            if (but1) {
                classNameStartsWith('android.widget.').text("立即预订").findOne().click();
                console.log("点击‘立即预订’按钮");
            } else if (but2) {
                classNameStartsWith('android.widget.').text("立即购票").findOne().click();
                console.log("点击‘立即购票’按钮");
            } else if (but3) {
                classNameStartsWith('android.widget.').text("特惠购票").findOne().click();
                console.log("点击‘特惠购票’按钮");
            }
            break;
        }
        sleep(200); // 等待按钮出现
    }

    // 刷新按钮自动点击线程
    threads.start(function () {
        log('刷新按钮自动点击线程已启动');
        while(true){
            textContains("刷新").waitFor();
            textContains("刷新").findOne().click();
            log("点击刷新...");
            sleep(500);  // 刷新频率设置为 0.5 秒
        }
    });

    // 遍历每个价位，尝试抢票
    for (let priceIndex = 0; priceIndex < ticketPrices.length; priceIndex++) {
        console.log("尝试监控价位：" + ticketPrices[priceIndex] + " 元");

        // 调用监控函数，监控当前价位
        let success = monitorTicketPrice(ticketPrices[priceIndex]);

        // 如果当前价位抢票成功，跳出循环
        if (success) {
            console.log("抢票成功！");
            confirmPayment(); // 进入支付流程
            break;
        }

        console.log("价位 " + ticketPrices[priceIndex] + " 元无票，尝试下一个价位");
    }

    console.log("抢票流程结束");
}

// 监控特定价位的函数
function monitorTicketPrice(maxTicketPrice) {
    console.log("开始监控票价 " + maxTicketPrice);

    const maxAttemptsPerPrice = 50;  // 每个价位的最大尝试次数
    for (let attempt = 0; attempt < maxAttemptsPerPrice; attempt++) {
        if (textContains("¥" + maxTicketPrice).exists()) {
            console.log("找到票价 " + maxTicketPrice + " 的余票，开始抢购");
            let ticketButton = textContains("¥" + maxTicketPrice).findOne();
            ticketButton.click();
            sleep(100);
            return true;  // 抢票成功
        }

        sleep(200);  // 刷新间隔
    }

    console.log("价位 " + maxTicketPrice + " 无票，放弃");
    return false;  // 放弃当前价位
}

// 确认购票和支付流程
function confirmPayment() {
    console.log("①准备确认购票");

    // 猛点“确认”按钮直到出现支付按钮
    for (let cnt = 0; cnt < 100; cnt++) {
        if (isDebug) {
            // 调试模式下模拟点击
            click(debugTicketClickX, debugTicketClickY);
        }

        // 点击确认按钮坐标
        click(ConfirmX, ConfirmY);

        // 或者查找“确认”按钮点击，避免坐标失误
        if (text("确认").exists()) {
            text("确认").click();
        }
        sleep(50);

        // 如果支付按钮已出现，跳出循环
        if (className("android.widget.Button").exists()) {
            console.log("已进入支付页面");
            break;
        }

        if (cnt % 20 == 0) {
            log("已点击确认次数：" + cnt);
        }
    }

    console.log("②准备确认支付");

    // 如果不在调试模式，开始支付操作
    if (!isDebug) {
        for (let cnt = 0; className("android.widget.Button").exists(); cnt++) {
            className("android.widget.Button").findOne().click();  // 点击支付按钮
            sleep(50);

            if (cnt % 20 == 0) {
                log("已点击支付次数：" + cnt);
            }
        }
    } else {
        console.log("调试模式，不点击支付按钮");
    }

    console.log("结束");
}

// 启动主函数
main();