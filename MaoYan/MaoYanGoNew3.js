// 检查无障碍服务是否已经启用，如果没有启用则跳转到无障碍服务启用界面，并等待无障碍服务启动；当无障碍服务启动后脚本会继续运行。
auto.waitFor();

// 打开猫眼App
app.launchApp("猫眼");

// 确认选票坐标，建议配置（不配置时仍会寻找“确认”按钮进行点击，但可能会出现点击失败的情况）
const ConfirmX = 878;
const ConfirmY = 2263;

// 是否在测试调试
var isDebug = false;

// 调试模式下的模拟票档自动选择的点击坐标
const debugTicketClickX = 207;
const debugTicketClickY = 1170;

// 使用构造函数定义 ElementCache
function ElementCache() {
    this.confirmButton = null;
    this.payButton = null;
    this.refreshButton = null;
    this.actionButtons = [];
}

ElementCache.prototype.preload = function () {
    // 预加载所有常用元素
    this.confirmButton = text("确认").findOne(5000);
    this.payButton = className("android.widget.Button").textContains("支付").findOne(5000);
    this.refreshButton = textContains("刷新").findOne(5000);

    const immediateBooking = classNameStartsWith('android.widget.').text("立即预订").findOne(2000);
    const immediatePurchase = classNameStartsWith('android.widget.').text("立即购票").findOne(2000);
    const specialOffer = classNameStartsWith('android.widget.').text("特惠购票").findOne(2000);

    if (immediateBooking) this.actionButtons.push(immediateBooking);
    if (immediatePurchase) this.actionButtons.push(immediatePurchase);
    if (specialOffer) this.actionButtons.push(specialOffer);
};

ElementCache.prototype.getConfirmButton = function () {
    if (!this.confirmButton) this.confirmButton = text("确认").findOne(5000);
    return this.confirmButton;
};

ElementCache.prototype.getPayButton = function () {
    if (!this.payButton) this.payButton = className("android.widget.Button").textContains("支付").findOne(5000);
    return this.payButton;
};

ElementCache.prototype.getRefreshButton = function () {
    if (!this.refreshButton) this.refreshButton = textContains("刷新").findOne(5000);
    return this.refreshButton;
};

ElementCache.prototype.getActionButton = function () {
    for (let btn of this.actionButtons) {
        if (btn.exists()) return btn;
    }

    const immediateBooking = classNameStartsWith('android.widget.').text("立即预订").findOne(2000);
    if (immediateBooking) return immediateBooking;

    const immediatePurchase = classNameStartsWith('android.widget.').text("立即购票").findOne(2000);
    if (immediatePurchase) return immediatePurchase;

    const specialOffer = classNameStartsWith('android.widget.').text("特惠购票").findOne(2000);
    if (specialOffer) return specialOffer;

    return null;
};

// 实例化缓存管理类
var elementCache = new ElementCache();

// 启动主函数
main();

function main() {
    console.log("开始猫眼抢票!");

    // 预加载常用元素
    elementCache.preload();

    // 检查是否已有预约信息
    var preBook = text("已 预 约").findOne(2000);
    var preBook2 = className("android.widget.TextView").text("已填写").findOne(2000);
    var isPreBook = preBook2 != null || preBook != null;
    console.log("界面是否已预约：" + isPreBook);
    if (!isPreBook && !isDebug) {
        console.log("无预约信息，请提前填写抢票信息!（若已经开票，请到票档界面使用MoYanMonitor.js）");
        return;
    }

    // 启动自动点击“刷新”按钮的线程
    var refreshThread = threads.start(function () {
        while (true) {
            let refreshBtn = elementCache.getRefreshButton();
            if (refreshBtn) {
                refreshBtn.click();
                log("点击刷新...");
                sleep(100); // 避免点击过快
            } else {
                console.log("刷新按钮未找到，尝试重新预加载...");
                elementCache.preload();
                sleep(500); // 等待一段时间后重试
            }
        }
    });

    console.log("等待开抢...");
    while (true) {
        let actionBtn = elementCache.getActionButton();
        if (actionBtn && actionBtn.exists()) {
            actionBtn.click();
            console.log("点击操作按钮：" + actionBtn.text());
            break;
        }
        sleep(100); // 避免CPU占用过高
    }

    console.log("①准备确认购票");

    autoConfirmPurchase();

    console.log("②准备确认支付");

    if (!isDebug) {
        autoConfirmPayment();
    } else {
        console.log("调试模式，不点击支付按钮");
    }

    console.log("结束");

    refreshThread.interrupt();
}


// 自动确认购票函数
function autoConfirmPurchase() {
    for (let cnt = 0; cnt >= 0; cnt++) {
        // 关闭应用自身的弹窗（如有）
        closeAppPopups();

        if (isDebug) {
            // 调试模式，模拟选择票档，模拟已预约后自动选择票档
            click(debugTicketClickX, debugTicketClickY);
            console.log(`调试模式点击票档坐标 (${debugTicketClickX}, ${debugTicketClickY})`);
        }

        // 使用缓存的“确认”按钮点击
        let confirmBtn = elementCache.getConfirmButton();
        if (confirmBtn && confirmBtn.exists()) {
            confirmBtn.click();
            console.log("点击“确认”按钮");
        } else {
            // 如果未预加载到“确认”按钮，尝试点击固定坐标
            click(ConfirmX, ConfirmY);
            console.log(`点击固定坐标 (${ConfirmX}, ${ConfirmY})`);
        }

        // 文字查找“确认”按钮进行点击，避免坐标点击失败
        if (text("确认").exists()) {
            text("确认").click();
            console.log("点击文本“确认”按钮");
        }

        sleep(50);

        // 检查是否出现“支付”按钮
        if (elementCache.getPayButton() && elementCache.getPayButton().exists()) {
            break;
        }

        if (cnt % 20 == 0) {
            log("已点击确认次数：" + cnt);
        }
    }
}

// 自动确认支付函数
function autoConfirmPayment() {
    let attemptMaxCnt = 150;
    for (let cnt = 0; cnt < attemptMaxCnt; cnt++) {
        // 关闭应用自身的弹窗（如有）
        closeAppPopups();

        let payBtn = elementCache.getPayButton();
        if (payBtn && payBtn.exists()) {
            payBtn.click();
            console.log("点击“支付”按钮");
            break;
        } else {
            // 如果未预加载到“支付”按钮，尝试重新预加载
            console.log("支付按钮未找到，尝试重新预加载...");
            elementCache.preload();
        }

        sleep(50);

        if (cnt % 20 == 0) {
            log("已点击支付次数：" + cnt);
        }
    }

    if (cnt >= attemptMaxCnt) {
        console.log("尝试次数过多，支付按钮仍未出现");
    }
}

// 函数：关闭应用自身的弹窗
function closeAppPopups() {
    // 示例：关闭可能出现的“关闭”按钮
    let closeBtn = textContains("关闭").findOne(1000);
    if (closeBtn) {
        closeBtn.click();
        console.log("关闭弹窗");
    }

    // 根据实际情况添加更多条件，如关闭其他类型的弹窗
    // 例如：
    // let adCloseBtn = textContains("广告").findOne(1000);
    // if (adCloseBtn) {
    //     adCloseBtn.click();
    //     console.log("关闭广告弹窗");
    // }
}