'use strict';

const Controller = require('egg').Controller;
const moment = require('moment');
// const statusDisp = {
//   PENDING: '处理中',
//   DONE: '处理完成，等待验收',
//   ACCEPT: '故障已解决',
//   REJECT: '故障仍未解决',
//   CLOSED: '已关闭',
//   SPAM: '无效信息',
// };

class MessageController extends Controller {
  // 创建消息
  async createMessage() {
    const { ctx } = this;
    // 允许相同部门工作人员留言
    const id = ctx.request.body.troubleId; // 故障Id
    const message = ctx.request.body.message; // 消息内容
    let isSameDepartment = false;
    const resOfTroubleId = await ctx.model.Trouble.findById(id);
    if (!resOfTroubleId) {
      ctx.error(-4, '没有查询到相关故障信息');
    }
    if (resOfTroubleId.status === 'PENDING' || resOfTroubleId.status === 'WAITING') {
      // 向双方推送消息

      const userCardnum = resOfTroubleId.userCardnum;
      const staffCardnum = resOfTroubleId.staffCardnum; // 负责该故障的维修人员
      const resOfStaffBind = await ctx.model.StaffBind.find({ staffCardnum: ctx.userInfo.cardnum });
      if (resOfStaffBind.length !== 0) {
        resOfStaffBind.forEach(k => {
          if (resOfTroubleId.departmentId === k.departmentId) isSameDepartment = true;
        });
      }

      const isDepartmentAdmin = !!(await ctx.model.DepartmentAdminBind.findOne({ adminCardnum: ctx.userInfo.cardnum, departmentId: resOfTroubleId.departmentId }));

      // 消息来自维修人员或者是部门管理员
      if (isSameDepartment || isDepartmentAdmin) {
        // 创建消息的是维修人员
        const now = +moment();
        ctx.service.pushNotification.userNotification(
          userCardnum,
          '亲爱的用户您好，针对你反馈的问题，运维人员的有了新的回复，请即时查看',
          resOfTroubleId.address,
          resOfTroubleId.typeName,
          '故障处理中',
          moment(now).format('YYYY-MM-DD HH:mm:ss'),
          '消息内容：' + message,
          this.ctx.helper.oauthUrl(ctx, 'detail', resOfTroubleId._id)
        );

        const newChatInfo = new ctx.model.ChatInfo({
          time: now,
          fromWho: 'staff',
          troubleId: id,
          content: message,
          fromWhoName: ctx.userInfo.name,
        });
        await newChatInfo.save();
        await ctx.service.wisedu.reply(id, ctx.userInfo.name, ctx.userInfo.cardnum, message, newChatInfo._id);
      } else if (ctx.userInfo.cardnum === userCardnum) {
        // 消息来自用户
        const now = +moment();

        ctx.service.pushNotification.staffNotification(
          staffCardnum,
          `用户${userCardnum}对反馈的问题进行了补充，请注意查看`,
          resOfTroubleId._id.toString().toUpperCase(),
          resOfTroubleId.typeName,
          resOfTroubleId.desc,
          resOfTroubleId.phonenum,
          moment(resOfTroubleId.createdTime).format('YYYY-MM-DD HH:mm:ss'),
          '消息内容：' + message,
          this.ctx.helper.oauthUrl(ctx, 'detail', resOfTroubleId._id) // url - 故障详情页面
        );

        const newChatInfo = new ctx.model.ChatInfo({
          time: now,
          fromWho: 'user',
          troubleId: id,
          content: message,
          fromWhoName: ctx.userInfo.name,
        });
        await newChatInfo.save();
        // 向金智推送消息回复
        await ctx.service.wisedu.reply(id, ctx.userInfo.name, ctx.userInfo.cardnum, message, newChatInfo._id);
      }
    }

  }
  // 获取消息列表
  async listMessage() {
    const { ctx } = this;
    const troubleId = ctx.query.troubleId;
    const resOfTroubleId = await ctx.model.ChatInfo.find({ troubleId }, [ 'content', 'time', 'fromWho', 'fromWhoName' ], { sort: { time: 1 } });
    return resOfTroubleId;
  }

}

module.exports = MessageController;
