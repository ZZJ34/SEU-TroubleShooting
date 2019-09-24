'use strict';

const Controller = require('egg').Controller;

class JsSdkTicketController extends Controller {
  async index() {
    const { ctx } = this;
    return {
        debug:false,
        ...(await ctx.service.getAccessToken.jsSdkTicket()),
        appId:ctx.app.config.wechat.appID,
        jsApiList: ['chooseImage','previewImage','uploadImage','hideAllNonBaseMenuItem','hideOptionMenu']
    }
    
  }
}

module.exports = JsSdkTicketController;