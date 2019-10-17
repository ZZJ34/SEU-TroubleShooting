'use strict'

const Controller = require('egg').Controller;

// 微信菜单配置页面
class WechatMenuController extends Controller {
    async get() {
        // 获取当前菜单结构
        const { ctx } = this;
        if(!ctx.userInfo.isAdmin){
            ctx.permissionError('无权操作')
        }
        let menuRecord = await this.ctx.model.Menu.find({})
        console.log(menuRecord)
        let res = {
            LEFT:{title:'',sub:[]},
            CENTER:{title:'',sub:[]},
            RIGHT:{title:'',sub:[]}

        }
        // 获取一级按钮
        menuRecord.forEach(r => {
            if(r.level === 1){
                res[r.position] = {
                    title:r.title,
                    sub:[]
                }
            }
        })
        // 获取二级按钮
        menuRecord.forEach(r => {
            if(r.level === 2){
                res[r.position].sub.push(r)
            }
        })
        // 二级菜单按钮排序
        Object.keys(res).forEach(position => {
            res[position].sub = res[position].sub.sort((a, b)=>{
                return a.order > b.order
            })
        })
        return res
    }

    async add(){
        // 添加/修改条目
        const { ctx } = this;
        if(!ctx.userInfo.isAdmin){
            ctx.permissionError('无权操作')
        }
        let { level, position, title, url } = ctx.request.body
        // 如果是一级菜单
        console.log(ctx.request.body)
        if(level === 1){
            let currentRecord = await ctx.model.Menu.findOne({ level, position })
            console.log(currentRecord)
            if(currentRecord){
                // 如果存在该菜单则修改其标题
                currentRecord.title = title
                await currentRecord.save()
            } else {
                // 不存在则创建
                // 创建之前检查 position 取值是否合法
                console.log('create')
                if(['LEFT', 'CENTER','RIGHT'].indexOf(position) === -1){
                    ctx.error(1, '菜单位置不合法')
                }
                let newRecord = new ctx.model.Menu({
                    title,
                    level:1,
                    position
                })
                await newRecord.save()
                return '设置成功'
            }
        } else if (level === 2) {
            // 如果是二级菜单
            // 先检查一级菜单是否存在，若一级菜单不存在则提示设置
            let levelOneRecord = await ctx.model.Menu.findOne({
                position,
                level:1
            })
            if(!levelOneRecord){
                ctx.error(2, '请先设置一级菜单标题')
            }
            // 一级菜单存在，继续进行设置
            // 检查当前二级菜单个数，如果二级菜单个数超过 5 个则不允许继续添加
            if((await ctx.model.Menu.countDocuments({level, position})) >= 5){
                ctx.error(3, '最多设置五个二级菜单')
            }
            // 获取目前已有菜单的 order
            let currentOrder = await ctx.model.Menu.find({},['order'],{   
                limit: 1,
                sort: { order: -1 }
            })
            currentOrder = currentOrder.length ? currentOrder[0].order : 0
            // 创建新的菜单
            let newRecord = new ctx.model.Menu({
                title,
                url,
                level:2,
                position,
                order:currentOrder + 1
            })
            await newRecord.save()
            return '创建成功'
        }
    }

    async exchange(){
        // 交换条目次序
        const { ctx } = this;
        if(!ctx.userInfo.isAdmin){
            ctx.permissionError('无权操作')
        }
        let {id1, id2} = ctx.request.body
        let record1 = await ctx.model.Menu.findById(id1)
        let record2 = await ctx.model.Menu.findById(id2)
        if(record1 && record2){
            let m = record1.order
            record1.order = record2.order
            record2.order = m
            await record1.save()
            await record2.save()
            return '设置成功'
        }
        ctx.error(4, '指定条目不存在')
    }

    async delete(){
        // 删除条目
        let { ctx } = this
        if(!ctx.userInfo.isAdmin){
            ctx.permissionError('无权操作')
        }
        let { id } = ctx.query
        await ctx.model.Menu.findByIdAndDelete(id)
        return 'success'
    }

    async push(){
        // 向微信服务器推送菜单设置
        
    }
}

module.exports = WechatMenuController;