$(function () {
    $("#jqGrid").jqGrid({
        url: '../sysdict/list',
        datatype: "json",
        colModel: [			
			{ label: 'id', name: 'id', index: 'id', width: 50, key: true },
			{ label: '父节点ID', name: 'parentId', index: 'parent_id', width: 80 }, 			
			{ label: '字典码', name: 'key', index: 'key', width: 80 }, 			
			{ label: '字典值', name: 'value', index: 'value', width: 80 }, 			
			{ label: '备注', name: 'notes', index: 'notes', width: 80 }, 			
			{ label: '序号', name: 'order', index: 'order', width: 80 }			
        ],
        postData:{'parentId': '1'},
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
    vm.getDictTree(null);
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
				/*vm.deptId=treeNode.id;
				vm.deptName=treeNode.name;
				vm.reload();*/
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
		sysDict: {}
	},
	methods: {
		query: function () {
			vm.reload();
		},
		add: function(){
			vm.showList = false;
			vm.title = "新增";
			vm.sysDict = {};
		},
		update: function (event) {
			var id = getSelectedRow();
			if(id == null){
				return ;
			}
			vm.showList = false;
            vm.title = "修改";
            
            vm.getInfo(id)
		},
		saveOrUpdate: function (event) {
			var url = vm.sysDict.id == null ? "../sysdict/save" : "../sysdict/update";
			$.ajax({
				type: "POST",
			    url: url,
			    data: JSON.stringify(vm.sysDict),
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
			var ids = getSelectedRows();
			if(ids == null){
				return ;
			}
			
			confirm('确定要删除选中的记录？', function(){
				$.ajax({
					type: "POST",
				    url: "../sysdict/delete",
				    data: JSON.stringify(ids),
				    success: function(r){
						if(r.code == 0){
							alert('操作成功', function(index){
								$("#jqGrid").trigger("reloadGrid");
							});
						}else{
							alert(r.msg);
						}
					}
				});
			});
		},
		getInfo: function(id){
			$.get("../sysdict/info/"+id, function(r){
                vm.sysDict = r.sysDict;
            });
		},
		reload: function (event) {
			vm.showList = true;
			var page = $("#jqGrid").jqGrid('getGridParam','page');
			$("#jqGrid").jqGrid('setGridParam',{ 
                page:page
            }).trigger("reloadGrid");
		},
		getDictTree: function(roleId) {
			//加载菜单树
			$.get("../sysdict/perms", function(r){
				console.log(r);
				ztree = $.fn.zTree.init($("#dictTree"), setting, r.sysDictList);
				//展开所有节点
				ztree.expandAll(true);
			});
	    }
	}
});