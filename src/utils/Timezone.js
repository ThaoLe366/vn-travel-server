module.exports.formatTimeUTC = function () {
  let currentTime = new Date(new Date().toUTCString());
  let timeZone = currentTime.getTimezoneOffset();
  return new Date(currentTime.getTime() - timeZone * 60000);
};

module.exports.formatTimeUTC_ = function (date) {
  let time = new Date(date);
  let currentTime = new Date(time.toUTCString());
  let timeZone = currentTime.getTimezoneOffset();
  return new Date(currentTime.getTime() - timeZone * 60000);
};

module.exports.generateCode = function (intCode) {
  return (intCode * 3 + 18110365 + "").substring(0, 6);
};
