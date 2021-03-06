'use strict';
const Controller = require('egg').Controller;
const sha1 = require('js-sha1');


class callbackController extends Controller {
  async callback() {
    // 根据ids小程序返回redirectURL
    const { ctx } = this;
    const { ids_session, name, cardnum, challenge, signature } = ctx.request.body;

    // 验证时请求是否来自ids小程序
    const str = `cardnum=${cardnum}&name=${name}&session=${ids_session}&challenge=${challenge}&secret=${ctx.app.config.idsSecret}`;
    if (signature !== sha1(str)) {
      // console.log('不是来自ids认证的请求，拒绝请求');
      ctx.error(-1, '不是来自ids认证的请求，拒绝请求');
    }
    // console.log('来自小程序的请求');
    // 获取用户的openid，创建新的用户
    const resOfidsSession = await ctx.model.Ids.findOne({ idsSession: ids_session });
    const newPerson = new ctx.model.User({
      openid: resOfidsSession.openId,
      cardnum,
      name,
    });

    await newPerson.save();
    // console.log(res)
    // 向用户推送redirectURL,
    // 只在wehcatOAuth发放token
    const redirectURL = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${ctx.app.config.wechat.appID}&redirect_uri=${ctx.app.config.serverURL}wechatOauth&response_type=code&scope=snsapi_base&state=${resOfidsSession.target}#wechat_redirect`;
    const content = `<a href="${redirectURL}">点击链接继续</a>`;
    await ctx.service.replyMessage.reply(resOfidsSession.openId, content);


  }
}

module.exports = callbackController;
