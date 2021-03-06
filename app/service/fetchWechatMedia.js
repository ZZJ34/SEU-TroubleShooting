'use strict';
const Service = require('egg').Service;
// const moment = require('moment');
const axios = require('axios');

class fetchWechatMediaService extends Service {
  async image(mediaId) {
    const accessToken = await this.ctx.service.getAccessToken.accessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaId}`;
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const base64 = res.data.toString('base64');
    // console.log(res.headers['content-type']);
    if (res.headers['content-type'].indexOf('image') !== -1) {
      return `data:${res.headers['content-type']};base64,${base64}`;
    }
  }
}

module.exports = fetchWechatMediaService;
