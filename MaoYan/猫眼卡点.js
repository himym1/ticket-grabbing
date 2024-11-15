// 等待无障碍服务启动
auto.waitFor();
// 打开猫眼 App
app.launchApp("猫眼");
openConsole();
console.setTitle("猫眼抢票助手", "#ff11ee00", 30);

// 确认选票的绝对坐标，具体值需调整
const ConfirmX = 878;
const ConfirmY = 2263;

// 是否为调试模式
const isDebug = false;
// 调试模式下模拟票档选择的点击坐标
const debugTicketClickX = 207;
const debugTicketClickY = 1170;

main();

function main() {
  console.log("开始猫眼抢票流程!");

  // 检测是否有“已预约”状态
  var preBook = text("已 预 约").findOne(2000);
  var preBook2 = className("android.widget.TextView").text("已填写").findOne(2000);
  var isPreBook = preBook2 != null || preBook != null;
  console.log("界面是否已预约：" + isPreBook);

  if (!isPreBook && !isDebug) {
    console.log("无预约信息，请提前填写抢票信息!");
    return;
  }

  console.log("等待开抢...");
  while (true) {
    // 检测“立即预订”、“立即购票”、“特惠购票”按钮
    var but1 = classNameStartsWith('android.widget.').text("立即预订").exists();
    var but2 = classNameStartsWith('android.widget.').text("立即购票").exists();
    var but3 = classNameStartsWith('android.widget.').text("特惠购票").exists();

    if (but1 || but2 || but3) {
      if (but1) {
        classNameStartsWith('android.widget.').text("立即预订").findOne().click();
      } else if (but2) {
        classNameStartsWith('android.widget.').text("立即购票").findOne().click();
      } else if (but3) {
        classNameStartsWith('android.widget.').text("特惠购票").findOne().click();
      }
      break;
    }
  }
  console.log("①准备确认购票");

  // 开始支付流程
  processPayment();
  console.log("抢票流程结束");
}

// 处理支付流程，包括检测弹框和点击支付按钮
function processPayment() {
  let waitTime = 200; // 初始等待时间 200 毫秒
  while (true) {
    // 检测并处理弹框
    if (textContains("前方拥堵").exists() && text("刷新").exists()) {
      console.log("检测到‘前方拥堵’弹框，点击‘刷新’按钮");
      let refreshButton = text("刷新").findOne(1000); // 等待刷新按钮出现
      if (refreshButton) {
        refreshButton.click();
        console.log("已点击‘刷新’按钮");
        waitTime = 200; // 点击后恢复快速检测
        sleep(200);
        continue; // 继续支付流程
      }
    }

    // 检测支付按钮
    if (textContains("立即支付").exists() || className("android.widget.Button").text("支付").exists()) {
      console.log("检测到支付按钮，点击支付");
      let payButton = className("android.widget.Button").text("支付").findOne(1000); // 等待支付按钮出现
      if (payButton) {
        payButton.click();
        console.log("已点击支付按钮");
        waitTime = 200; // 点击后恢复快速检测
        sleep(200);
        continue; // 继续支付流程
      }
    }

    // 检测确认按钮
    if (text("确认").exists()) {
      console.log("检测到确认按钮，点击确认");
      let confirmButton = text("确认").findOne(1000); // 等待确认按钮出现
      if (confirmButton) {
        confirmButton.click();
        console.log("已点击确认按钮");
        waitTime = 200; // 点击后恢复快速检测
        sleep(200);
        continue; // 继续支付流程
      }
    }

    // 如果没有检测到目标，逐步增加等待时间
    console.log("未检测到目标控件，延长检测间隔：" + waitTime + " 毫秒");
    sleep(waitTime);
    waitTime = Math.min(waitTime + 100, 500); // 最大延长到 500 毫秒
  }
}
