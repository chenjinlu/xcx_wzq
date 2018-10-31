//main.js
const util = require('../../utils/util.js')
const cas = wx.createCanvasContext("chess");

Page({
  data: {
    count: 0, //所有的赢法的总个数
    over:false, 
    frist:true, 
    step:0, 
    time:'',
    indexArrs:[], //所有已落子坐标数组
    wins:[], //所有赢法数组
    whiteWin:[], 
    blackWin:[],
    hdata:[], //历史数据
    show:0 //历史记录显示或隐藏
  },
  showOrHidden:function(){
    var showzt = this.data.show == 0? 1:0;
    this.setData({
      show: showzt
    })
  },
  init: function(){
    /* 初始化棋盘 */ 
    cas.save();  
    cas.setStrokeStyle = '#BFBFBF';
    for (var i = 0; i < 15; i++) {//初始化棋盘
      cas.moveTo(10 + 20 * i, 10);
      cas.lineTo(10 + 20 * i, 290);
      cas.moveTo(10, 10 + 20 * i);
      cas.lineTo(290, 10 + 20 * i);
    }
    cas.stroke();
    cas.draw();
    
    /* 初始化棋盘位置的记录*/
    for (var i = 0; i < 15; i++) {
      this.data.indexArrs[i] = [];
      for (var j = 0; j < 15; j++) {
        this.data.indexArrs[i][j] = 0;
      }
    }
    /* 初始化五子棋中所有的赢法 */
    this.initWins();
    /* 初始化统计数组 ,类似于 所有赢法的指针*/
    for (var i = 0; i < this.data.count; i++) {
      this.data.whiteWin[i] = 0;
      this.data.blackWin[i] = 0;
    }
  },
  initWins:function(){
    //初始化三维数组
    for(var i= 0;i<15;i++){
      this.data.wins[i] = [];
      for (var j = 0; j < 15; j++) {
        this.data.wins[i][j] = [];
      }
    }
    //计算赢法种类  0->> 000  010  020  030  040 | 1->> 011  021  031  041  051 | .....
    for (var i = 0; i < 15; i++) {//横线
      for (var j = 0; j < 11; j++) {
        for (var k = 0; k < 5; k++) {
          this.data.wins[i][j + k][this.data.count] = true;
        }
        this.data.count++;
      }
    }
    for (var i = 0; i < 11; i++) {//竖线
      for (var j = 0; j < 15; j++) {
        for (var k = 0; k < 5; k++) {
          this.data.wins[i + k][j][this.data.count] = true;
        }
        this.data.count++;
      }
    }
    for (var i = 0; i < 11; i++) {//斜线
      for (var j = 0; j < 11; j++) {
        for (var k = 0; k < 5; k++) {
          this.data.wins[i + k][j + k][this.data.count] = true;
        }
        this.data.count++;
      }
    }
    for (var i = 0; i < 11; i++) {//反斜线
      for (var j = 14; j > 3; j--) {
        for (var k = 0; k < 5; k++) {
          this.data.wins[i + k][j - k][this.data.count] = true;
        }
        this.data.count++;
      }
    }
	},
  addEvent: function (e){ //点击操作
    if (this.data.over || !this.data.frist) return;
    var x = Math.floor(e.changedTouches[0].x / 20);
    var y = Math.floor(e.changedTouches[0].y / 20);
    console.log(x+'|'+y);
    if (this.data.indexArrs[x][y]) return;
    this.data.indexArrs[x][y] = 1;
    this.oneStep(x, y, this.data.frist);
    this.data.step++;
    //更新步数
    this.setData({
      step: this.data.step
    })

    var that = this
    for (var i = 0; i < this.data.count; i++) {
      if (this.data.wins[x][y][i]) {
        this.data.whiteWin[i]++;
        this.data.blackWin[i] = -1;
        if (this.data.whiteWin[i] == 5) {
          setTimeout(function () {
            that.tj(1);
            that.alert('恭喜你，赢了');
          }, 100);
          this.data.over = true;
          break;
        }
      }
    }
    if (!this.data.over) {
      this.data.frist = !this.data.frist;
      this.computerAI();
    }
  },
  oneStep: function (x, y, wob) {//落子函数, wob=true 黑色, wob=false 白色
    if (!this.data.time) this.data.time = Math.ceil(new Date().getTime() / 1000);   
    cas.restore();   
    cas.beginPath();
    cas.arc(10 + 20 * x, 10 + 20 * y, 9, 0, 2 * Math.PI);
    var grad = cas.createCircularGradient(10 + 20 * x , 10 + 20 * y , 9);
    if (wob) {     
      grad.addColorStop(0, '#636766');
      grad.addColorStop(1, '#0A0A0A');
    } else {
      grad.addColorStop(0, '#F9F9F9');
      grad.addColorStop(1, '#D1D1D1');      
    }
    cas.fillStyle = grad;
    cas.closePath();
    cas.fill();
    cas.draw(true);
  },
  computerAI:function(){
    var ws = [], bs = [];
    for (var i = 0; i < 15; i++) {
      ws[i] = []; bs[i] = [];
      for (var j = 0; j < 15; j++) {
        ws[i][j] = 0; bs[i][j] = 0;
      }
    }
    var max = 0, u = 0, v = 0
    for (var i = 0; i < 15; i++) {//遍历棋盘
      for (var j = 0; j < 15; j++) {
        if (!this.data.indexArrs[i][j]) {//棋盘此处无子
          for (var k = 0; k < this.data.count; k++) {
            if (this.data.wins[i][j][k]) {
              if (this.data.whiteWin[k] == 1) {
                ws[i][j] += 200;
              } else if (this.data.whiteWin[k] == 2) {
                ws[i][j] += 400;
              } else if (this.data.whiteWin[k] == 3) {
                ws[i][j] += 2000;
              } else if (this.data.whiteWin[k] == 4) {
                ws[i][j] += 10000;
              }
              if (this.data.blackWin[k] == 1) {
                bs[i][j] += 220;
              } else if (this.data.blackWin[k] == 2) {
                bs[i][j] += 440;
              } else if (this.data.blackWin[k] == 3) {
                bs[i][j] += 2100;
              } else if (this.data.blackWin[k] == 4) {
                bs[i][j] += 20000;
              }
            }
          }

          if (ws[i][j] > max) {
            max = ws[i][j]; u = i; v = j;
          } else if (ws[i][j] == max) {
            if (bs[i][j] > ws[i][j]) {
              u = i; v = j;
            }
          }

          if (bs[i][j] > max) {
            max = bs[i][j]; u = i; v = j;
          } else if (bs[i][j] == max) {
            if (ws[i][j] > bs[i][j]) {
              u = i; v = j;
            }
          }
        }
      }
    }
    // console.log( 'white:'+ws[u][v] );
    console.log(u + ',' + v + '|' + max);
    this.data.indexArrs[u][v] = 2;
    this.oneStep(u, v, this.data.frist);

    var that = this;
    for (var i = 0; i < this.data.count; i++) {
      if (this.data.wins[u][v][i]) {
        this.data.blackWin[i]++;
        this.data.whiteWin[i] = 6;
        if (this.data.blackWin[i] == 5) {          
          setTimeout(function () {            
            that.tj(0);
            that.alert('很遗憾，输了');
          }, 100);
          this.data.over = true;
          break;
        }
      }
    }
    
    if (!this.data.over) this.data.frist = !this.data.frist;
  },
  tj: function(f){
    var total = wx.getStorageSync('wzq-total');
    var arr = wx.getStorageSync('wzq-arr');
    if (!total) {
      total = 0;
      arr = [];
    } else {
      arr = JSON.parse(arr);     
    }   
    total++;

    var useStep = this.data.step;
    var useTime = 0;
    if (this.data.time) useTime = Math.ceil(new Date().getTime() / 1000) - this.data.time;
    var result = 2;    

    arr[total-1] = {
      "zt": f,
      "bs": useStep,
      "ys": useTime
    };

    this.setData({
      hdata: arr
    })
    
    // this.chg();
    wx.setStorageSync('wzq-total', total);
    wx.setStorageSync('wzq-arr', JSON.stringify(arr));
  },
  onLoad: function () {
    /* 初始化统计表格数据 */
    var that = this;
    var total = wx.getStorageSync('wzq-total');
    var arr = wx.getStorageSync('wzq-arr');
    // console.log(arr);
    if (total && arr) {
      arr = JSON.parse(arr);
      var i = 0;
      if (arr.length > 10) i = arr.length - 10;
      var nArr = [];
      for (var j=0; i < arr.length; i++,j++) {
        nArr[j] = arr[i];
      }
      that.setData({
        hdata: nArr
      })
    }
    // console.log(nArr);
    this.init();

  },
  alert:function(msg){
    wx.showToast({
      title: msg,
      icon: 'none',
      duration: 3000
    })
  },
  new_game:function(){
    this.setData({
      count : 0, 
      over : false, 
      frist : true, 
      step : 0, 
      time : ''
    })
    this.init();
  },
  clear_game:function(){
    wx.setStorageSync('wzq-total', 0);
    wx.setStorageSync('wzq-arr', []);
    this.setData({
      hdata: []
    })
  }
})
