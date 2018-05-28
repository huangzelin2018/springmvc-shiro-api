$(function () {
	 vm.getLoginUser();
	 $("#jqGrid").jqGrid({
	        url: '../sys/user/list',
	        datatype: "json",
	        colModel: [			
				{ label: '用户ID', name: 'userId', index: "user_id", width: 45, key: true,hidden:true },
				{ label: '用户名', name: 'username', width: 75 },
				{ label: '姓名', name: 'realname', width: 75 },
				{ label: '邮箱', name: 'email', width: 90 },
				{ label: '手机号', name: 'mobile', width: 100 },
				{ label: '部门', name: 'deptName', width: 100 },
				{ label: '状态', name: 'status', width: 80, formatter: function(value, options, row){
					return value === 0 ? 
						'<span class="label label-danger">禁用</span>' : 
						'<span class="label label-success">正常</span>';
				}},
				{ label: '创建时间', name: 'createTime', index: "create_time", width: 80}
	        ],
	        postData:{'deptId': vm.deptId},
			viewrecords: true,
	        height: 385,
	        rowNum: 10,
			rowList : [10,30,50],
	        rownumbers: true, 
	        rownumWidth: 25, 
	        autowidth:true,
	        multiselect: true,
	        pager: "#jqGridPager",
	        jsonReader : {
	            root: "page.list",
	            page: "page.currPage",
	            total: "page.totalPage",
	            records: "page.totalCount"
	        },
	        prmNames : {
	            page:"page", 
	            rows:"limit", 
	            order: "order"
	        },
	        gridComplete:function(){
	        	//隐藏grid底部滚动条
	        	$("#jqGrid").closest(".ui-jqgrid-bdiv").css({ "overflow-x" : "hidden" }); 
	        }
	});
    vm.getMenuTree(null);
});

var setting = {
		data: {
			simpleData: {
				enable: true,
				idKey: "id",
				pIdKey: "parentId",
				rootPId: 0
			},
			key: {
				url:"nourl"
			}
		},
		callback:{
			onClick:function(event, treeId, treeNode){
				vm.deptId=treeNode.id;
				vm.deptName=treeNode.name;
				vm.reload();
				//alert(treeNode.id + ", " + treeNode.name);
			}
		}
};


var ztree;

var vm = new Vue({
	el:'#rrapp',
	data:{
		showList: true,
		title: null,
		sysDepartment: {},
		q:{
			username: null
		},
		roleList:{},
		user:{
			status:1,
			roleIdList:[]
		},
		deptId:null,
		deptName:null,
		type:1
	},
	methods: {
		query: function () {
			vm.reload();
		},
		add: function(event){
			vm.type=1;
			if(vm.deptName==null){
				vm.getInfo(vm.deptId);
			}else{
				$("#parentName").val(vm.deptName);
			}
			var parentDept = {parentId:vm.deptId};
			vm.sysDepartment = parentDept;
			layer.open({
				type: 1,
				offset: '50px',
				skin: 'layui-layer-molv',
				title: "新增部门",
				area: ['550px', '270px'],
				content: jQuery("#opeaatorDepartment"),
				btn: ['确定', '取消'],
				btn1: function (index) {
					var url = "../sysdepartment/save";
					$.ajax({
						type: "POST",
					    url: url,
					    data: JSON.stringify(vm.sysDepartment),
					    success: function(r){
					    	if(r.code === 0){
								alert('操作成功', function(dd){
									layer.close(index);
									vm.getMenuTree(null);
									//vm.reload();
								});
							}else{
								alert(r.msg);
							}
						}
					});
	            }
			});
		},
		update: function (event) {
			vm.type=2;
			var node = ztree.getSelectedNodes();
			if(node==null || node ==""){
				alert("请选择修改部门");
			}else{
				var sysDepartment = {name:node[0].name,id:node[0].id};
				vm.sysDepartment = sysDepartment;
				layer.open({
					type: 1,
					offset: '50px',
					skin: 'layui-layer-molv',
					title: "新增部门",
					area: ['550px', '270px'],
					content: jQuery("#opeaatorDepartment"),
					btn: ['确定', '取消'],
					btn1: function (index) {
						var url = "../sysdepartment/update";
						$.ajax({
							type: "POST",
						    url: url,
						    data: JSON.stringify(vm.sysDepartment),
						    success: function(r){
						    	if(r.code === 0){
									alert('操作成功', function(dd){
										layer.close(index);
										vm.getMenuTree(null);
										//vm.reload();
									});
								}else{
									alert(r.msg);
								}
							}
						});
		            }
				});
			}
		},
		saveOrUpdate: function (event) {
			var url = vm.sysDepartment.id == null ? "../sysdepartment/save" : "../sysdepartment/update";
			$.ajax({
				type: "POST",
			    url: url,
			    data: JSON.stringify(vm.sysDepartment),
			    success: function(r){
			    	if(r.code === 0){
						alert('操作成功', function(index){
							vm.reload();
						});
					}else{
						alert(r.msg);
					}
				}
			});
		},
		del: function (event) {
			var node = ztree.getSelectedNodes();
			if(node==null || node ==""){
				alert("没有选择要删除的部门！");
			}else{
				var id = node[0].id;
				var ids=new Array();
				ids[0]=id;
				var deptName = node[0].name;
				confirm('确定要'+deptName+'部门？', function(){
					$.ajax({
						type: "POST",
					    url: "../sysdepartment/delete",
					    data: JSON.stringify(ids),
					    async:true,
					    success: function(r){
							if(r.code == 0){
								alert('操作成功', function(index){
									//$("#jqGrid").trigger("reloadGrid");
									vm.getMenuTree(null);
								});
							}else{
								alert(r.msg);
							}
						}
					});
				});
			}
		},
		getInfo: function(id){
			$.get("../sysdepartment/info/"+id,false, function(r){
				$("#parentName").val(r.sysDepartment.name);
				vm.deptName = r.sysDepartment.name;
                //vm.sysDepartment = r.sysDepartment;
            });
		},
		getMenuTree: function(roleId) {
			//加载菜单树
			$.get("../sysdepartment/perms", function(r){
				ztree = $.fn.zTree.init($("#menuTree"), setting, r.departmentList);
				//展开所有节点
				ztree.expandAll(true);
			});
	    },
	    user_query: function () {
			vm.reload();
		},
		user_add: function(){
			var node = ztree.getSelectedNodes();
			$("#deptName").val(node[0].name);
			vm.showList = false;
			vm.title = "新增";
			vm.roleList = {};
			vm.user = {status:1,roleIdList:[],deptId:node[0].id};
			
			//获取角色信息
			this.getRoleList();
		},
		user_update: function () {
			var userId = getSelectedRow();
			if(userId == null){
				return ;
			}
			
			vm.showList = false;
            vm.title = "修改";
			
			vm.getUser(userId);
			//获取角色信息
			this.getRoleList();
		},
		user_del: function () {
			var userIds = getSelectedRows();
			if(userIds == null){
				return ;
			}
			confirm('确定要删除选中的记录？', function(){
				$.ajax({
					type: "POST",
				    url: "../sys/user/delete",
				    data: JSON.stringify(userIds),
				    success: function(r){
						if(r.code == 0){
							alert('操作成功', function(index){
                                vm.reload();
							});
						}else{
							alert(r.msg);
						}
					}
				});
			});
		},
		user_saveOrUpdate: function (event) {
			var url = vm.user.userId == null ? "../sys/user/save" : "../sys/user/update";
			$.ajax({
				type: "POST",
			    url: url,
			    data: JSON.stringify(vm.user),
			    success: function(r){
			    	if(r.code === 0){
						alert('操作成功', function(index){
							vm.reload();
						});
					}else{
						alert(r.msg);
					}
				}
			});
		},
		getLoginUser:function(){
			$.ajax({
				type: "GET",
			    url: "../sys/user/info",
			    async:false,
			    success: function(r){
			    	if(r.code === 0){
			    		vm.deptId=r.user.deptId;
			    		vm.user = r.user;
					}else{
						alert(r.msg);
					}
				}
			});
		},
		getUser: function(userId){
			$.get("../sys/user/info/"+userId, function(r){
				vm.user = r.user;
			});
		},
		getRoleList: function(){
			$.get("../sys/role/select", function(r){
				vm.roleList = r.list;
			});
		},
		reload: function (event) {
			vm.showList = true;
			var page = $("#jqGrid").jqGrid('getGridParam','page');
			$("#jqGrid").jqGrid('setGridParam',{ 
                postData:{'username': vm.q.username,'deptId': vm.deptId},
                page:page
            }).trigger("reloadGrid");
		}
	}
});

