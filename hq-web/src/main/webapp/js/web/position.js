$(function () {
    $("#jqGrid").jqGrid({
        url: '../web/position/list',
        datatype: "json",
        colModel: [
            {label: '职位id', name: 'id', index: 'id', width: 50, key: true},
            {label: '名称', name: 'jobTitle', index: 'job_title', width: 80},
            {label: '职位类别', name: 'positionTypeEntity.jobTypeName', index: 'job_type_id', width: 80},
            {label: '发布时间', name: 'createTime', index: 'create_time', width: 80},
            {label: '招聘人数', name: 'jobCount', index: 'job_count', width: 80},
            {label: '学历要求', name: 'education', index: 'education', width: 80},
            {label: '是否上下架', name: 'isUse', index: 'is_use', width: 80, formatter: function(value, options, row){
                    if(value === 1){
                        return '<span class="label label-success">上架</span>';
                    }else if(value === 0){
                        return '<span class="label label-danger">下架</span>';
                    }
                }
            }
        ],
        viewrecords: true,
        height: 385,
        rowNum: 10,
        rowList: [10, 30, 50],
        rownumbers: true,
        rownumWidth: 25,
        autowidth: true,
        multiselect: true,
        pager: "#jqGridPager",
        jsonReader: {
            root: "page.list",
            page: "page.currPage",
            total: "page.totalPage",
            records: "page.totalCount"
        },
        prmNames: {
            page: "page",
            rows: "limit",
            order: "order"
        },
        gridComplete: function () {
            //隐藏grid底部滚动条
            $("#jqGrid").closest(".ui-jqgrid-bdiv").css({"overflow-x": "hidden"});
        }
    });
});

var setting = {
    data: {
        simpleData: {
            enable: true,
            idKey: "jobTypeId",
            pIdKey: "jobTypePid",
            rootPId: -1
        },
        key: {
            url:"nourl",
            name:"jobTypeName"
        }
    }
};
var ztree;

var vm = new Vue({
    el: '#rrapp',
    data: {
        showList: true,
        title: null,
        position: {},
        positionType: {}
    },
    methods: {
        getInfoType: function(){
            //加载菜单树
            $.get("../web/positiontype/select", function(r){
                ztree = $.fn.zTree.init($("#menuTree"), setting, r.menuList);
            })
        },
        query: function () {
            vm.reload();
        },
        add: function () {
            vm.showList = false;
            vm.title = "新增";
            vm.position = {orderNum:1,isUse:1};
            vm.positionType.jobTypeName="职位分类";
            vm.getInfoType();
        },
        update: function (event) {
            var id = getSelectedRow();
            if (id == null) {
                return;
            }
            vm.showList = false;
            vm.title = "修改";

            vm.getInfo(id)
        },
        saveOrUpdate: function (event) {
            var url = vm.position.id == null ? "../web/position/save" : "../web/position/update";
            $.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(vm.position),
                success: function (r) {
                    if (r.code === 0) {
                        alert('操作成功', function (index) {
                            vm.reload();
                        });
                    } else {
                        alert(r.msg);
                    }
                }
            });
        },
        del: function (event) {
            var ids = getSelectedRows();
            if (ids == null) {
                return;
            }

            confirm('确定要删除选中的记录？', function () {
                $.ajax({
                    type: "POST",
                    url: "../web/position/delete",
                    data: JSON.stringify(ids),
                    success: function (r) {
                        if (r.code == 0) {
                            alert('操作成功', function (index) {
                                $("#jqGrid").trigger("reloadGrid");
                            });
                        } else {
                            alert(r.msg);
                        }
                    }
                });
            });
        },
        getInfo: function (id) {
            $.get("../web/position/info/" + id, function (r) {
                vm.position = r.position;
                vm.positionType = r.position.positionTypeEntity;
            });
            vm.getInfoType();
        },
        menuTree: function(){
            layer.open({
                type: 1,
                offset: '50px',
                skin: 'layui-layer-molv',
                title: "选择职位分类",
                area: ['300px', '450px'],
                shade: 0,
                shadeClose: false,
                content: jQuery("#menuLayer"),
                btn: ['确定', '取消'],
                btn1: function (index) {
                    var node = ztree.getSelectedNodes()[0];
                    if(node==null||node.level!=1){
                        alert("请选择职位分类");
                        return false;
                    }
                    vm.positionType={jobTypeName:node.jobTypeName};
                    vm.position.jobTypeId=node.jobTypeId;
                    layer.close(index);
                }
            });
        },
        reload: function (event) {
            vm.showList = true;
            var page = $("#jqGrid").jqGrid('getGridParam', 'page');
            $("#jqGrid").jqGrid('setGridParam', {
                page: page
            }).trigger("reloadGrid");
        }
    }
});