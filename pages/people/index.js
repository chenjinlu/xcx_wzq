// pages/people/index.js
let Tool = require("../../utils/util.js");
const cas = wx.createCanvasContext("chess");
var chat;
var socketOpen = false //websocket是否连接

Page({

  /**
   * 页面的初始数据
   */
  data: {
    count: 0, //所有的赢法的总个数
    over: false,
    frist: true,
    chess: '',
    step: 0,
    time: '',
    login:false,
    people: [],
    client_id:'',
    chatCont:[],//聊天内容
    setchess:false,
    indexArrs: [], //所有已落子坐标数组
    wins: [], //所有赢法数组
    whiteWin: [],
    blackWin: [],
    hdata: [], //历史数据
    show: 0 //历史记录显示或隐藏
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // console.log(options);
    /* 初始化 */
    this.init();
    let _this = this;
    chat = wx.connectSocket({
      url: 'ws://192.168.1.205:7272',
      data: {
        'room_id': '1',
        'client_name': '1234'
      },
      method: "GET"
    });
    /* 打开websocket连接 */
    wx.onSocketOpen(function (res) {
      socketOpen = true;
      /* 登录房间 */
      _this.start(options);
    })
    
  },
  init: function () {
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
  initWins: function () {
    //初始化三维数组
    for (var i = 0; i < 15; i++) {
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
  addEvent: function (e) { //点击操作
    if (!this.data.login) {
      this.alert('未登录');
      return;
    }
    if (this.data.people < 2) {
      this.alert('人数不足2人，无法下子！');
      return;
    }
    if ( this.data.over || !this.data.setchess ) return;
    var x = Math.floor(e.changedTouches[0].x / 20);
    var y = Math.floor(e.changedTouches[0].y / 20);
    console.log(x + '|' + y);
    if (this.data.indexArrs[x][y]) return;
    //通知服务器落子信息
    let downChess = '{"type":"chess","to_client_id":"all","x":' + x + ',"y":' + y + ',"chess":"'+this.data.chess+'"}';
    wx.sendSocketMessage({
      data: downChess
    })
  },
  oneStep: function (x, y, wob) {//落子函数, wob=true 黑色, wob=false 白色
    if (!this.data.time) this.data.time = Math.ceil(new Date().getTime() / 1000);
    cas.restore();
    cas.beginPath();
    cas.arc(10 + 20 * x, 10 + 20 * y, 9, 0, 2 * Math.PI);
    var grad = cas.createCircularGradient(10 + 20 * x, 10 + 20 * y, 9);
    if (wob == 'black') {
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

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },
  start: function (e) {
    //监听WebSocket 连接打开事件
    // console.log(socketOpen);

    var nickname = wx.getStorageSync('nickname');
    nickname = (nickname != "" && nickname != undefined) ? nickname : 'man';
    // console.log(nickname);
    //登录
    var login_data = '{ "type": "login", "client_name": "' + nickname + '", "room_id": "' + e.roomid + '" }';
    wx.sendSocketMessage({
      data: login_data
    }) 
    console.log('login success!');   
  },
  choice:function(){
    if( !this.data.login ) {
      this.alert('未登录');
      return; 
    }
    if( this.data.people.length < 2 ){
      this.alert('人数不足2人，无法选子！');
      return;
    }
    var login_data = '{ "type": "setchess", "to_client_id":"all", "chess": "white" }';
    wx.sendSocketMessage({
      data: login_data
    })
    this.setData({
      setchess: true
    })
  },
  sendmsg:function(){
    if (!this.data.login) return; 
    var data = '{"type":"chess","to_client_id":"all","x":"2","y":"3"}';
    wx.sendSocketMessage({
      data: data
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var _this = this, ltnr = {};
    chat.onMessage(function(res){
      console.log(res);
      let msg = JSON.parse(res.data);
      switch (msg.type){
        // 服务端ping客户端
        case 'ping':
          wx.sendSocketMessage({
            data: '{"type":"pong"}'
          })
          break;
        // 登录 更新用户列表
        case 'login':
          ltnr['name'] = msg['client_name'];
          ltnr['content'] = '进入了房间';
          ltnr['time'] = msg['time'];
          //{"type":"login","client_id":xxx,"client_name":"xxx","client_list":"[...]","time":"xxx"}
          if (msg['client_list'] != undefined){
            // console.log(Tool.objToArr(msg['client_list']));
            // console.log(_this.data.people.concat(msg['client_list']) )
            _this.setData({
              client_id: msg['client_id'],
              login: true,
              people: _this.data.people.concat(Tool.objToArr(msg['client_list'])),
              chatCont: _this.data.chatCont.concat(ltnr)
            })
          }else{
            var newpeople = {};
            // newpeople[msg.client_id] = msg.client_name;
            newpeople.id = msg.client_id;
            newpeople.val = msg.client_name;
            // console.log(newpeople);
            _this.setData({
              people: _this.data.people.concat(newpeople),
              chatCont: _this.data.chatCont.concat(ltnr)
            })
            // Object.assign(_this.data.people, newpeople)
          }
          
          wx.showToast({
            title: msg['client_name'] + ' 加入了聊天室',
            icon: 'none'
          })
          break;
        // 选子
        case 'setchess':         
          ltnr['name'] = msg['from_client_name'];         
          ltnr['time'] = msg['time'];
          ltnr['content'] = '我选择了白子';
          if ( msg['from_client_id'] == _this.data.client_id ){            
            _this.setData({
              setchess: true,
              chess: 'white',
              over:false,
              chatCont: _this.data.chatCont.concat(ltnr)
            })
          }else{
            _this.setData({
              setchess: true,
              chess: 'black',
              over:true,
              chatCont: _this.data.chatCont.concat(ltnr)
            })
          }          
          break;
        //下棋 {"type":"chess","to_client_id":"all","x":"2","y":"3","chess":"white"}
        case 'chess':
          _this.rivalPlay(msg);
          break;
        // 发言
        case 'say':
          //{"type":"say","from_client_id":xxx,"to_client_id":"all/client_id","content":"xxx","time":"xxx"}
          ltnr['name'] = msg['from_client_name'];
          ltnr['content'] = msg['content'];
          ltnr['time'] = msg['time'];
          // console.log(ltnr);
          _this.setData({
              chatCont: _this.data.chatCont.concat(ltnr)
          })      
          break;
        // 用户退出
        case 'logout':
          //{"type":"logout","client_id":xxx,"time":"xxx"}
          wx.showToast({
            title: msg['from_client_name'] + ' 退出了',
            icon: 'none'
          })
          ltnr['name'] = msg['from_client_name'];
          ltnr['content'] = msg['from_client_name'] + ' 退出了';
          ltnr['time'] = msg['time'];

          for (var i in _this.data.people){
            if (_this.data.people[i]['id'] == msg['from_client_id']){
              _this.data.people.splice(i, 1);
            }           
          }
          _this.setData({
            people: _this.data.people,
            chatCont: _this.data.chatCont.concat(ltnr)
          });
          _this.new_game();//退出后结束游戏
          break;
      }
    });
  },
  formSubmit:function(e){
    let params = e.detail.value;
    // console.log(params)
    if (!this.data.login) return;
    var data = '{"type":"say","to_client_id":"all","content":"' + params.content +'"}';
    wx.sendSocketMessage({
      data: data
    })
  },
  rivalPlay:function(e){
    let u = e.x, v = e.y;
    if( e.chess == this.data.chess ){
      this.data.over = true;
    }else{
      this.data.over = false;
    }
    
    this.oneStep(u, v, e.chess);
    var that = this;

    if ( e.chess == 'white') {
      this.data.indexArrs[u][v] = 2;     
      for (var i = 0; i < this.data.count; i++) {
        if (this.data.wins[u][v][i]) {
          this.data.blackWin[i]++;
          this.data.whiteWin[i] = 6;
          if (this.data.blackWin[i] == 5) {
            setTimeout(function () {
              if (e['from_client_id'] == that.data.client_id) {
                console.log('恭喜你，你赢了');
                that.alert('恭喜你，你赢了');
              } else {
                console.log('很遗憾，输了');
                that.alert('很遗憾，输了');
              }
            }, 100);
            this.data.over = true;
            break;
          }
        }
      }
    }else{
      this.data.indexArrs[u][v] = 1;
      for (var i = 0; i < this.data.count; i++) {
        if (this.data.wins[u][v][i]) {
          this.data.whiteWin[i]++;
          this.data.blackWin[i] = -1;
          if (this.data.whiteWin[i] == 5) {
            setTimeout(function () {
              if (e['from_client_id'] == that.data.client_id) {
                console.log('恭喜你，你赢了');
                that.alert('恭喜你，你赢了');
              } else {
                console.log('很遗憾，输了');
                that.alert('很遗憾，输了');
              }
            }, 100);
            this.data.over = true;
            break;
          }
        }
      }
    }
    

    // if (!this.data.over) this.data.frist = !this.data.frist;
  },
  alert: function (msg) {
    wx.showToast({
      title: msg,
      icon: 'none',
      duration: 3000
    })
  },
  new_game: function () {
    this.setData({
      count: 0,
      over: false,
      frist: true,
      step: 0,
      time: '',
      setchess: false
    })
    this.init();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    wx.closeSocket();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})