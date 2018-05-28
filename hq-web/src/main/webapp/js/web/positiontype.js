$(function () {
    $("#jqGrid").jqGrid({
        url: cxt+'/web/positiontype/list',
        datatype: "json",
        colModel: [
            { label: 'id', name: 'id', index: 'id', width: 50, key: true },
            { label: '职位分类名称', name: 'jobTypeName', index: 'job_type_name', width: 80 },
            { label: '类别小图', name: 'jobTypePic', index: 'job_type_pic', width: 80 },
            { label: '排序', name: 'orderNum', index: 'order_num', width: 80 },
            { label: '创建时间', name: 'createTime', index: 'create_time', width: 80 }, 														            {label: '是否上下架', name: 'isUse', index: 'is_use', width: 80, formatter: function(value, options, row){
                    if(value === 1){
                        return '<span class="label label-success">上架</span>';
                    }else if(value === 0){
                        return '<span class="label label-danger">下架</span>';
                    }
                }
            }			        ],
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
});

var vm = new Vue({
    el:'#rrapp',
    data:{
        showList: true,
        title: null,
        positionType: {}
    },
    methods: {
        query: function () {
            vm.reload();
        },
        add: function(){
            vm.showList = false;
            vm.title = "新增";
            vm.positionType = {orderNum:1,isUse:1};
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
            var url = vm.positionType.id == null ? cxt+"/web/positiontype/save" : cxt+"/web/positiontype/update";
            $.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(vm.positionType),
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
                    url: cxt+"/web/positiontype/delete",
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
            $.get(cxt+"/web/positiontype/info/"+id, function(r){
                vm.positionType = r.positionType;
            });
        },
        reload: function (event) {
            vm.showList = true;
            var page = $("#jqGrid").jqGrid('getGridParam','page');
            $("#jqGrid").jqGrid('setGridParam',{
                page:page
            }).trigger("reloadGrid");
        }
    }
});