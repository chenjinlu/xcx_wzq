const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function objToArr( obj ){
  var out_arr = [];
  for (var key in obj) {
    var temp = {};			//创建临时对象
    // temp[key] = obj[key];	
    temp.id = key;		//存储对象的Key为name	
    temp.val = obj[key];	//存储value	
    out_arr.push(temp);    
  }
  return out_arr;
}

module.exports = {
  formatTime: formatTime,
  objToArr: objToArr
}
