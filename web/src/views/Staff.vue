<template>
  <div id="type-view" class="page">
    <div>
      <div class="title">{{departmentName}}</div>
      <div class="title-hint">添加部门员工以及设置部门管理员，只有添加到该部门的员工才能处理部门分管的故障</div>
      <div class="content">
        <el-form label-width="80px">
          <el-form-item label="一卡通号">
            <el-input v-model="cardnum" placeholder="员工的一卡通号"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="add">添加员工</el-button>
            <el-button type="primary" @click="setAdmin">设置管理员</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div style="margin-top:40px;">
      <div class="title">部门管理员</div>
      <div class="title-hint">此处列出该部门的管理员，部门管理员可以转发该部门所有的故障申报信息</div>
      <div class="content">
        <el-table :data="adminList" style="width: 100%">
          <el-table-column prop="name" label="姓名"></el-table-column>
          <el-table-column prop="adminCardnum" label="一卡通号"></el-table-column>
          <el-table-column label="操作" width="60">
            <template slot-scope="scope">
              <el-button @click="openDialog(scope.row.adminCardnum, 'departmentAdmin')" type="text" size="small">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    <div style="margin-top:40px;">
      <div class="title">管理部门员工</div>
      <div class="title-hint">此处列出部门所有员工</div>
      <div class="content">
        <el-table :data="list" style="width: 100%">
          <el-table-column prop="name" label="姓名"></el-table-column>
          <el-table-column prop="staffCardnum" label="一卡通号"></el-table-column>
          <el-table-column label="操作" width="60">
            <template slot-scope="scope">
              <el-button @click="openDialog(scope.row.staffCardnum, 'staff')" type="text" size="small">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    <el-dialog title="提示" :visible.sync="dialogVisible" width="90%" >
      <span>是否确定删除</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="deleteBind">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      departmentName: "...",
      list: [],
      adminList: [],
      token: "",
      cardnum: "",
      dialogVisible: false,
      deleteTarget: "",
      deleteType: ""
    };
  },
  methods: {
    async add() {
      let res = await this.$axios.post(
        "/department/staff",
        { departmentId: this.departmentId, staffCardnum: this.cardnum },
        { headers: { token: this.token } }
      );
      if (res.data.success) {
        this.$message({ type: "success", message: "添加成功" });
        this.load();
      } else {
        this.$message.error(res.data.errmsg);
      }
    },
    async setAdmin() {
      let res = await this.$axios.post(
        "/department/admin",
        { departmentId: this.departmentId, adminCardnum: this.cardnum },
        { headers: { token: this.token } }
      );
      if (res.data.success) {
        this.$message({ type: "success", message: "设置成功" });
        this.load();
      } else {
        this.$message.error(res.data.errmsg);
      }
    },
    async load() {
      let res = await this.$axios.get(
        "/department/staff?departmentId=" + this.departmentId,
        {
          headers: { token: this.token }
        }
      );
      this.list = res.data.result;
      res = await this.$axios.get(
        "/department/name?departmentId=" + this.departmentId
      );
      this.departmentName = res.data.result;
      res = await this.$axios.get(
        "/department/admin?departmentId=" + this.departmentId,
        {
          headers: { token: this.token }
        }
      );
      this.adminList = res.data.result;
    },
    async deleteStaff(staffCardnum) {
      await this.$axios.delete(
        "/department/staff?staffCardnum=" +
          staffCardnum +
          "&departmentId=" +
          this.departmentId,
        {
          headers: { token: this.token }
        }
      );
      this.load();
    },
    async deleteAdmin(adminCardnum) {
      await this.$axios.delete(
        "/department/admin?adminCardnum=" +
          adminCardnum +
          "&departmentId=" +
          this.departmentId,
        {
          headers: { token: this.token }
        }
      );
      this.load();
    },
    async deleteBind() {
      let res;
      if (this.deleteType === "staff") {
        res = await this.$axios.delete(
          "/department/staff?staffCardnum=" +
            this.deleteTarget +
            "&departmentId=" +
            this.departmentId,
          {
            headers: { token: this.token }
          }
        );
      } else if (this.deleteType === "departmentAdmin") {
        res = await this.$axios.delete(
          "/department/admin?adminCardnum=" +
            this.deleteTarget+
            "&departmentId=" +
            this.departmentId,
          {
            headers: { token: this.token }
          }
        );
      }
      if(res.data.success){
        this.$message({
          message: '删除成功',
          type: 'success'
        })
      }else{
          this.$message({
          message: '删除失败',
          type: 'error'
        })
      }
      this.dialogVisible = false;
      this.load();
    },
    openDialog(cardnum, type) {
      this.deleteTarget = cardnum;
      this.deleteType = type;
      this.dialogVisible = true;
    }
  },
  created() {
    this.token = this.$route.params.token;
    this.departmentId = this.$route.params.departmentId;
    this.load();
  }
};
</script>

<style>
#type-view {
  margin-top: 30px;
}
</style>